declare global {
  type NoUndefined<T> = T extends undefined ? never : T;
}

export default global;
