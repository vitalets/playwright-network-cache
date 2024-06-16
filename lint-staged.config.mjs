export default {
  '*.{ts,js}': ['eslint --fix', 'prettier --write --ignore-unknown'],
  '!(*.{ts,js})': ['prettier --write --ignore-unknown'],
};
