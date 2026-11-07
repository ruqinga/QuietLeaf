# QuietLeaf · 页间

[中文](README.md) | **English**

A private e-reader you install on your iPhone home screen, built for reading English books. On every page it lists the harder words for you. Tap a word to see its meaning, hear it pronounced, or save it to your word book. Your books and notes stay on your phone.

**👉 Open the reader: <https://ruqinga.github.io/QuietLeaf/>**

> The app's interface is in Chinese. The labels in brackets below (e.g. 「我的书架」) are the on-screen text, so you can find each button.

---

## Install on iPhone

1. Open the link above in **Safari**.
2. Tap **Share** → **Add to Home Screen**.
3. From then on, always open it from the 「页间」 icon on your home screen.
4. Stay online the first time you open it. The offline dictionary (about 1.4 MB) downloads in the background, and after that word lookup works without a network.

> The home-screen app and the Safari website keep separate data. Always use the home-screen icon. Books imported on one side don't show up on the other.

## Bookshelf

- Tap **＋** next to 「我的书架」 (My Shelf) to import EPUB or PDF files. You can pick several at once.
- 「封面 / 列表 / 分组」: switch between cover, list and group views.
- Search by title or author. 「最近阅读 ↓」 toggles between recently read and title order.
- The **···** button on a book lets you continue reading, add it to or remove it from a group, or delete it.

## Reading

| Gesture | Result |
|---|---|
| Tap the left / right side, or swipe | Previous / next page |
| Tap the middle | Show / hide the menu: back, notes, read aloud, contents, text settings, progress |
| Tap an English word | Show its meaning and phonetic in the word panel |
| Long-press to select text | Look up, highlight, add a note, read aloud |

The **Aa** button sets the theme (paper / sepia / night), font size, line spacing, font and speech rate. Your reading position is saved automatically.

## Words on this page

When you turn to a page of an English book, the reader picks out the harder words, listed in the order they appear in the text.

- **Portrait**: a word panel sits at the bottom. It shows one word; tap 「展开」 (expand) to see the full list.
- **Landscape**: a left column always lists every hard word on the page, and you can scroll it.
- Every word shows its **phonetic and Chinese meaning**:
  - Tap the row to hear the word and show its full meaning at the top.
  - Tap 🔊 to just hear it.
  - Tap ☆ to save it to the word book. The star turns solid ★, and tapping it again removes the word.
- Inflected forms are matched to their base word (meandered → meander).

You choose what counts as "hard" in **我的 → 词典偏好** (Me → Dictionary preferences):

| Level | Shows |
|---|---|
| 基础 · CET-4 (basic) | CET-6 level and above |
| 中级 · CET-6 (intermediate) | IELTS / TOEFL level and above |
| 高级 · IELTS/GRE (advanced) | GRE and rare words only |

You can also set how many words the expanded portrait list shows, and whether to hide words you have marked as mastered.

## Notes & word book

The 「笔记」 (Notes) tab collects highlights, notes and saved words from all your books.

- 「全部 / 划线 / 想法 / 生词」 means all / highlights / notes / words.
- In **生词** (words) you can:
  - filter by book;
  - search by English word or Chinese meaning;
  - for each word: see its phonetic, tap 🔊 to hear it, mark it mastered (○ / ✓), or remove it (★).
- Words you mark as mastered no longer appear in the page word list (you can turn this off).
- 「导出全部笔记 Markdown」 exports everything as a Markdown file.

## Saved websites

The 「收藏」 (Favorites) tab keeps links you use often, such as dictionary sites or reading communities.

- While the list is empty, the form is shown. After that, tap **＋** at the top right to add a link.
- Only the URL and a name are saved. Page content is not downloaded.

## Me

- **Stats**: books, finished books, reading minutes, saved words, highlights, reading days.
- **Dictionary preferences**: level, list size, offline dictionary status, and a 「重新下载」 (re-download) button.
- **数据与阅读** (Data & reading), folded until you tap it:
  - where your data is stored, how much space it uses, and when you last backed up;
  - text, theme and speech settings;
  - full backup export and restore.

## Keeping your data safe

- Books, notes and words are stored **only on this phone**. Nothing is uploaded.
- Updating the app to a new version **does not** delete anything.
- Your data **is lost** if you:
  - delete the home-screen icon;
  - clear this site's data under Settings → Safari → Advanced → Website Data;
  - open the reader from a different address.
- **Back up regularly**: 我的 → 数据与阅读 → 「导出完整数据备份」, then save the file to the Files app or iCloud Drive. To move to a new phone, use 「恢复数据备份」 (restore).

## FAQ

**I don't see the latest changes.**
While online, swipe the app away completely and open it again once or twice. You don't need to clear any data.

**My books are missing when I open the link in Safari.**
The home-screen app and Safari keep separate storage. Your books are still in the home-screen app.

**Can I look up words in PDFs?**
Not yet. PDFs open in the system viewer, so you can read and turn pages, but there are no highlights and no word lookup.

**Some books won't open.**
DRM-protected EPUBs and scanned PDFs (images with no text layer) are not supported.

**Does word lookup need the internet?**
No. The offline dictionary has about 45,000 words. If a word isn't in it and you are online, the reader also checks an online English dictionary.

---

The offline dictionary comes from [ECDICT](https://github.com/skywind3000/ECDICT) (MIT License). Please only import books you have the right to use. Developer notes are in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) (Chinese).
