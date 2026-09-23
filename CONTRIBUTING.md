# Contributing to Mande-IA

Thank you for helping build useful, respectful technology for Bambara speakers.

## Good contributions

- Correct a Bambara phrase and explain the preferred wording or regional variation.
- Add a Bambara phrase together with French and English meanings.
- Suggest a test case that helps measure whether a response is useful and respectful.
- Improve accessibility, reliability, privacy, or documentation.

## Phrase format

Use the following format in `public/bambara-demo.js`:

```js
{ category: 'Category', bm: 'Bambara phrase', fr: 'French meaning', en: 'English meaning' }
```

Please avoid presenting one regional wording as the only correct wording. Add a note in the pull request when a phrase varies by region or context.

## Before opening a pull request

1. Do not include `.env`, tokens, passwords, databases, recordings, or private conversations.
2. Test the JavaScript syntax with `node --check public/bambara-demo.js`.
3. Describe the source of the phrase: personal knowledge, language teacher review, or another source that you have permission to use.

## Respect and consent

Do not submit sensitive personal information, harmful content, or copyrighted text without permission. Mande-IA aims to work with language communities and welcomes corrections made in a respectful way.
