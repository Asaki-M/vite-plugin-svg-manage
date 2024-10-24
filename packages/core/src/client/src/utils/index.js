export function classifyByDirectory(filesInfo) {
  const directoryMap = {};

  filesInfo.forEach(file => {
    const directory = file.publicPath.substring(0, file.publicPath.lastIndexOf('/'));
    if (!directoryMap[directory]) {
      directoryMap[directory] = [];
    }
    directoryMap[directory].push(file);
  });

  return Object.keys(directoryMap).map(directory => ({
    title: directory,
    list: directoryMap[directory]
  }));
}
