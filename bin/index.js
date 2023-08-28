#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const SUCCESS = "\x1b[32m%s\x1b[0m";
const ERROR = "\x1b[31m%s\x1b[0m";
const WARNING = "\x1b[33m%s\x1b[0m";
function parseJSON(jsonObj, parentKey = "") {
  let result = [];

  for (const key in jsonObj) {
    const currentKey = parentKey ? `${parentKey}.${key}` : key;

    if (typeof jsonObj[key] === "object") {
      result = result.concat(parseJSON(jsonObj[key], currentKey));
    } else {
      result.push(currentKey);
    }
  }

  return result;
}
function getKeysSet(data) {
  try {
    const jsonObject = JSON.parse(data);
    const parsedKeys = parseJSON(jsonObject);
    return new Set(parsedKeys);
  } catch (parseError) {
    console.error("Error parsing JSON:", parseError);
  }
  return new Set([]);
}
function compareTwoJson(path1, path2, includeDirName) {
  const data1 = fs.readFileSync(path1, "utf8");
  const data2 = fs.readFileSync(path2, "utf8");
  let name1 = path.parse(path1).name;
  let name2 = path.parse(path2).name;
  if (includeDirName) {
    name1 = `${path.basename(path.dirname(path.normalize(path1)))}/${name1}`;
    name2 = `${path.basename(path.dirname(path.normalize(path2)))}/${name2}`;
  }
  const set1 = getKeysSet(data1);
  const set2 = getKeysSet(data2);
  const inSet1 = [...set1].filter((x) => !set2.has(x));
  const inSet2 = [...set2].filter((x) => !set1.has(x));
  return [
    { name: name1, have: inSet1 },
    { name: name2, have: inSet2 },
  ];
}

function processFilesInDirectories(dir1, dir2) {
  const filesDiff = [];
  const files1 = fs.readdirSync(dir1);
  const files2 = fs.readdirSync(dir2);
  const missingFiles2 = files1.filter((file) => !files2.includes(file));
  const missingFiles1 = files2.filter((file) => !files1.includes(file));
  files1
    .filter((file) => files2.includes(file))
    .forEach((file1) => {
      const jsonFilePath1 = path.join(dir1, file1);
      const fileNameWithoutExtension = path.parse(file1).name;
      if (files2.includes(`${fileNameWithoutExtension}.json`)) {
        const jsonFilePath2 = path.join(dir2, `${fileNameWithoutExtension}.json`);
        filesDiff.push(compareTwoJson(jsonFilePath1, jsonFilePath2, { includeDirName: true }));
      }
    });
  return [
    filesDiff,
    { name: path.basename(dir1), missingFiles: missingFiles1 },
    { name: path.basename(dir2), missingFiles: missingFiles2 },
  ];
}
function printTwoFilesDiff(diffs) {
  diffs.forEach((diff) => {
    if (diff.have.length !== 0) {
      console.log(WARNING, `${diff.name}.json have ${diff.have.length} more keys:`);
      diff.have.forEach((key) => {
        console.log(`${key}`);
      });
      console.log();
    }
  });
}
const arg1 = process.argv[2];
const arg2 = process.argv[3];
if (!arg1 || !arg2) {
  console.log(ERROR, "Provide two directories or two json files!");
  return;
}
const arg1Stats = fs.statSync(arg1);
const arg2Stats = fs.statSync(arg2);
if (arg1Stats.isDirectory() && arg2Stats.isDirectory()) {
  const [diff, ...missingFilesByDirectory] = processFilesInDirectories(arg1, arg2);
  missingFilesByDirectory.forEach((directory) => {
    if (directory.missingFiles !== 0) {
      console.log(ERROR, `${directory.name} is missing the following files:`);
      directory.missingFiles.forEach((file) => {
        console.log(file);
      });
      console.log();
    }
  });
  const isAllFilesEqual = diff.every(
    ([file1, file2]) => file1.have.length === 0 && file2.have.length === 0
  );
  if (!isAllFilesEqual) diff.forEach((fileDiff) => printTwoFilesDiff(fileDiff));
  else console.log(SUCCESS, "All Files have the same keys ✔️");
} else if (
  arg1Stats.isFile() &&
  arg2Stats.isFile() &&
  path.extname(arg1) === ".json" &&
  path.extname(arg2) === ".json"
) {
  const diff = compareTwoJson(arg1, arg2);
  const isKeysEqual = diff[0].have.length === 0 && diff[1].have.length === 0;
  if (!isKeysEqual) printTwoFilesDiff(diff);
  else console.log(SUCCESS, `${diff[0].name}.json and ${diff[1].name}.json keys are the same ✔️`);
} else {
  console.error(
    ERROR,
    "Invalid Arguments!! either provide two directories or provide two json files."
  );
}
