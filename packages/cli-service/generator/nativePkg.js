exports.getPkg = () => {
  return {
    scripts: {
      dev: 'vite',
      build: 'vite build',
      serve: 'vite preview',
    },
    devDependencies: {
      vite: '^2.5.10',
    },
  }
}
