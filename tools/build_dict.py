#!/usr/bin/env python3
"""Build the compact offline English-Chinese dictionary used by QuietLeaf.

Source: ECDICT (https://github.com/skywind3000/ECDICT, MIT License).

Usage:
    curl -LO https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv
    python3 tools/build_dict.py ecdict.csv

Writes dict/en-zh.json and dict/version.json. Output format:
    {"v": <version>, "w": {word: [phonetic, translation, level]}, "f": {inflected_form: lemma}}
Level 1-5 is the approximate difficulty: 1 = middle/high school, 2 = CET-4,
3 = CET-6 / postgraduate exam, 4 = IELTS / TOEFL, 5 = GRE or rare.
"""
import csv, hashlib, json, os, re, sys

VERSION = 1
MAX_RANK = 60000          # keep words within this frequency rank (BNC / COCA)
MAX_LINES = 3             # translation lines kept per word
MAX_CHARS = 90            # translation length cap
TAG_LEVEL = {'zk': 1, 'gk': 1, 'cet4': 2, 'cet6': 3, 'ky': 3, 'ielts': 4, 'toefl': 4, 'gre': 5}
WORD_RE = re.compile(r"^[a-z](?:[a-z'-]*[a-z])?$")


def rank_of(row):
    ranks = [int(x) for x in (row['frq'], row['bnc']) if x and x.isdigit() and int(x) > 0]
    return min(ranks) if ranks else 0


def freq_level(rank):
    if not rank: return 5
    for limit, level in ((2500, 1), (5000, 2), (9000, 3), (15000, 4)):
        if rank <= limit: return level
    return 5


def short_translation(text):
    lines = [l.strip() for l in text.replace('\\r', '').split('\\n') if l.strip()]
    plain = [l for l in lines if not l.startswith('[')]       # drop [网络] / [医] … when possible
    picked = (plain or lines)[:MAX_LINES]
    out = '；'.join(picked)
    return out if len(out) <= MAX_CHARS else out[:MAX_CHARS - 1] + '…'


def has_own_inflections(word, exchange):
    """True when a word lists inflections other than itself, i.e. it behaves as a real lemma."""
    return any(p[:2] in ('p:', 'd:', 'i:', '3:', 's:') and p[2:].strip().lower() != word for p in exchange.split('/'))


def main(src, out_dir):
    words, exchanges, tagged = {}, {}, {}
    with open(src, encoding='utf-8') as fh:
        for row in csv.DictReader(fh):
            w = row['word'].strip()
            if not WORD_RE.match(w) or not row['translation'].strip():
                continue
            tags = row['tag'].split()
            rank = rank_of(row)
            keep = tags or (row['collins'] not in ('', '0')) or row['oxford'] == '1' or (0 < rank <= MAX_RANK)
            if not keep:
                continue
            level = min([TAG_LEVEL[t] for t in tags if t in TAG_LEVEL] + [freq_level(rank)])
            phon = row['phonetic'].replace('ә', 'ə').strip()
            words[w] = [phon, short_translation(row['translation']), level]
            exchanges[w] = row['exchange']
            tagged[w] = bool(tags) or row['oxford'] == '1'
    # Inflected forms that also have their own minor entry (e.g. "contemplated" -> "a. 预期的")
    # read better as the base word, so fold them in unless the form itself is an exam word.
    for lemma, ex in list(exchanges.items()):
        for part in ex.split('/'):
            kind, _, form = part.partition(':')
            form = form.strip().lower()
            if kind in ('p', 'd', 'i', '3', 's') and form != lemma and form in words and lemma in words \
                    and not tagged.get(form) and not has_own_inflections(form, exchanges.get(form, '')):
                del words[form]
    forms = {}
    for lemma, ex in exchanges.items():
        for part in ex.split('/'):
            kind, _, form = part.partition(':')
            form = form.strip().lower()
            if kind in ('p', 'd', 'i', '3', 's', 'r', 't') and WORD_RE.match(form) and form not in words and form != lemma:
                forms.setdefault(form, lemma)
    data = {'v': VERSION, 'w': dict(sorted(words.items())), 'f': dict(sorted(forms.items()))}
    os.makedirs(out_dir, exist_ok=True)
    body = json.dumps(data, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    with open(os.path.join(out_dir, 'en-zh.json'), 'wb') as fh:
        fh.write(body)
    meta = {'version': VERSION, 'words': len(words), 'forms': len(forms), 'bytes': len(body),
            'sha1': hashlib.sha1(body).hexdigest()[:12], 'source': 'ECDICT (MIT)'}
    with open(os.path.join(out_dir, 'version.json'), 'w', encoding='utf-8') as fh:
        json.dump(meta, fh, ensure_ascii=False)
    print(meta)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), '..', 'dict'))
