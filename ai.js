// AI reading assistant: one chat() for Claude (official Anthropic SDK, bundled in vendor/) and for
// OpenAI-compatible Chat Completions APIs (OpenAI GPT, DeepSeek, or any compatible endpoint).
// Keys are entered by the user and stay on this device; requests go straight from the device to the provider.
const QLAI = (() => {
  const PROVIDERS = {
    claude:   {label: 'Claude（Anthropic）', kind: 'anthropic', model: 'claude-opus-5-5', base: '', keyHint: 'sk-ant-…'},
    openai:   {label: 'OpenAI（GPT）', kind: 'openai', model: 'gpt-4o-mini', base: 'https://api.openai.com/v1', keyHint: 'sk-…'},
    deepseek: {label: 'DeepSeek', kind: 'openai', model: 'deepseek-chat', base: 'https://api.deepseek.com/v1', keyHint: 'sk-…'},
    custom:   {label: '其他（OpenAI 兼容接口）', kind: 'openai', model: '', base: '', keyHint: ''},
  };
  // Claude models that accept the server-side refusal fallback, and models that accept output_config.effort.
  const FALLBACK_MODELS = new Set(['claude-fable-5-2', 'claude-fable-5-1', 'claude-opus-5-5', 'claude-opus-5', 'claude-sonnet-5-5']);
  const EFFORT_MODELS = /^claude-(fable|mythos|opus|sonnet|haiku)-5|^claude-opus-4-[5-8]|^claude-sonnet-4-6/;

  class AIError extends Error {}
  let sdk = null;

  async function anthropicChat({apiKey, model, system, messages, onText, signal}) {
    sdk = sdk || import('./vendor/anthropic-sdk.mjs');
    const Anthropic = (await sdk).default;
    const client = new Anthropic({apiKey, dangerouslyAllowBrowser: true, maxRetries: 1});
    const params = {model, max_tokens: 64000, system, messages};
    // A reading assistant answers short questions: low effort keeps replies quick and cheap.
    if (EFFORT_MODELS.test(model)) params.output_config = {effort: 'low'};
    const stream = FALLBACK_MODELS.has(model)
      ? client.beta.messages.stream({...params, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default'}, {signal})
      : client.messages.stream(params, {signal});
    stream.on('text', delta => onText?.(delta));
    try {
      const msg = await stream.finalMessage();
      if (msg.stop_reason === 'refusal') throw new AIError('模型拒绝回答这个问题' + (msg.stop_details?.explanation ? '：' + msg.stop_details.explanation : '。'));
      return msg.content.filter(b => b.type === 'text').map(b => b.text).join('');
    } catch (e) {
      if (e instanceof AIError) throw e;
      if (e instanceof Anthropic.APIUserAbortError) throw Object.assign(new AIError('已停止'), {aborted: true});
      if (e instanceof Anthropic.AuthenticationError) throw new AIError('API Key 无效，请检查后重试。');
      if (e instanceof Anthropic.PermissionDeniedError) throw new AIError('这个 Key 没有权限使用该模型。');
      if (e instanceof Anthropic.NotFoundError) throw new AIError('找不到模型「' + model + '」，请检查模型名称。');
      if (e instanceof Anthropic.RateLimitError) throw new AIError('请求太频繁或额度不足，请稍后再试。');
      if (e instanceof Anthropic.BadRequestError) throw new AIError('请求被拒绝：' + e.message);
      if (e instanceof Anthropic.InternalServerError) throw new AIError('Claude 服务暂时不可用，请稍后再试。');
      if (e instanceof Anthropic.APIConnectionError) throw new AIError('网络连接失败，请检查网络。');
      if (e instanceof Anthropic.APIError) throw new AIError('Claude 接口错误（' + e.status + '）：' + e.message);
      throw e;
    }
  }

  function statusText(status) {
    return {400: '请求格式有误', 401: 'API Key 无效', 402: '账户余额不足', 403: '没有权限', 404: '接口地址或模型名称不存在', 429: '请求太频繁或额度不足'}[status] || ('接口错误 ' + status);
  }

  async function openaiChat({apiKey, model, base, system, messages, onText, signal}) {
    if (!/^https:\/\//i.test(base || '')) throw new AIError('请填写以 https:// 开头的接口地址。');
    let res;
    try {
      res = await fetch(base.replace(/\/+$/, '') + '/chat/completions', {
        method: 'POST', signal,
        headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey},
        body: JSON.stringify({model, stream: true, messages: [{role: 'system', content: system}, ...messages]}),
      });
    } catch (e) {
      if (e.name === 'AbortError') throw Object.assign(new AIError('已停止'), {aborted: true});
      throw new AIError('网络连接失败，或该服务不允许网页直接访问（CORS）。');
    }
    if (!res.ok) {
      let detail = '';
      try { const j = await res.json(); detail = j.error?.message || j.message || ''; } catch {}
      throw new AIError(statusText(res.status) + (detail ? '：' + detail : '。'));
    }
    const reader = res.body.getReader(), dec = new TextDecoder();
    let buf = '', out = '';
    try {
      for (;;) {
        const {done, value} = await reader.read();
        if (done) break;
        buf += dec.decode(value, {stream: true});
        let i;
        while ((i = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, i).trim();
          buf = buf.slice(i + 1);
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (data === '[DONE]') return out;
          try {
            const delta = JSON.parse(data).choices?.[0]?.delta?.content || '';
            if (delta) { out += delta; onText?.(delta); }
          } catch {}
        }
      }
    } catch (e) {
      if (e.name === 'AbortError') throw Object.assign(new AIError('已停止'), {aborted: true});
      throw e;
    }
    return out;
  }

  // cfg: {provider, apiKey, model, base}; messages: [{role:'user'|'assistant', content:string}]
  async function chat(cfg, {system, messages, onText, signal}) {
    const p = PROVIDERS[cfg.provider] || PROVIDERS.claude;
    if (!cfg.apiKey) throw new AIError('请先在「我的 → AI 助手」填写 API Key。');
    const model = (cfg.model || p.model || '').trim();
    if (!model) throw new AIError('请先填写模型名称。');
    if (p.kind === 'anthropic') return anthropicChat({apiKey: cfg.apiKey, model, system, messages, onText, signal});
    return openaiChat({apiKey: cfg.apiKey, model, base: (cfg.base || p.base || '').trim(), system, messages, onText, signal});
  }

  return {PROVIDERS, chat, AIError};
})();
