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

export const readFilesAsArrayBuffer = (files) => {
  if (files.length === 0) return []
  const filePromises = files.map(file => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onloadend = () => {
        resolve({ content: fileReader.result, name: file.name });
      };
      fileReader.onerror = () => {
        reject(new Error(`Error reading file: ${file.name}`));
      };
      fileReader.readAsDataURL(file);
    });
  });

  return Promise.all(filePromises);
};