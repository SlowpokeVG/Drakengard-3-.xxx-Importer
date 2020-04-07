const fs = require("fs");
const path = require("path");
const walk = function(dir) 
{
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) 
    {
        file = dir + '/' + file;
        file_name = file.split(/(\\|\/)/g).pop();
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) 
        { 
            results = results.concat(walk(file));
        } else 
        { 
            results.push(file);
        }
    });
    return results;
}

let arguments = process.argv.slice(2);
if (arguments.length < 3)
    throw "Not enough arguments. Pass name of the folder with original files, folder with edited files and file to import to."

const originalFolderName = arguments[0];
const editedFolderName = arguments[1];
const archiveFileName = arguments[2];
let archiveFile = fs.readFileSync(archiveFileName);
let archiveFileOrig = fs.readFileSync(archiveFileName);

const originalFiles = walk(originalFolderName);
console.log("Parsed original folder");
const editedFiles = walk(editedFolderName);
console.log("Parsed modded folder");

// make a list of files

let fileNames=[];
let fileSizesOriginal =[];
let fileSizesModified =[];
let isModified =[];

for (i=0; i<originalFiles.length; i++)
{
    if (path.parse(originalFiles[i]).name != path.parse(editedFiles[i]).name) throw ("Files in modified folder should be the same as in original folder");
    let originalFile = fs.readFileSync(originalFiles[i]);
    let modifiedFile = fs.readFileSync(editedFiles[i]);

    fileSizesOriginal.push(originalFile.length);
    fileSizesModified.push(modifiedFile.length);
    fileNames.push(path.parse(originalFiles[i]).name);
    isModified.push(Buffer.compare(originalFile, modifiedFile));
}


// make a list of names from the archive

let namesArchive = [];

const nameCount = archiveFile.readInt32BE(0x19);
const nameOffset = archiveFile.readInt32BE(0x1D);
let currentNameOffset = 0;
for (i=0; i<nameCount; i++)
{
    let byteCount = archiveFile.readInt32BE(nameOffset + currentNameOffset);
    namesArchive.push(archiveFile.slice(nameOffset + currentNameOffset + 4, nameOffset + currentNameOffset + 4 + byteCount -1).toString("utf-8"));
    currentNameOffset += byteCount + 4 + 8;
}


// make a list of sizes, offsets and nameIDs

let nameIDsArch = [];
let sizesArch = [];
let fileOffsetsArch = [];
let parameterOffsets = [];

const exportCount = archiveFile.readInt32BE(0x21);
const exportOffset = archiveFile.readInt32BE(0x25);
let currentOffset = exportOffset;
while (currentOffset<archiveFile.readInt32BE(0x31))
{   

    if ((archiveFile[currentOffset]==0xFF)&&(archiveFile[currentOffset+1]==0xFF)&&(archiveFile[currentOffset+2]==0xFF))
    {
        nameIDsArch.push(archiveFile.readInt32BE(currentOffset + 0x0C));
        sizesArch.push(archiveFile.readInt32BE(currentOffset + 0x20));
        fileOffsetsArch.push(archiveFile.readInt32BE(currentOffset + 0x24));
        parameterOffsets.push(currentOffset);
    }
    currentOffset+=4;
}
console.log(parameterOffsets.length + "  " + exportCount)

//console.log(namesArchive)
// go through files and apply changes

const filesOffset = archiveFile.readInt32BE(0x35);
for (i=0; i<originalFiles.length; i++)
{
    if (isModified[i] != 0) 
    {
        console.log (originalFiles[i] + " " + isModified[i])

        let originalFile = fs.readFileSync(originalFiles[i]);
        let modifiedFile = fs.readFileSync(editedFiles[i]);
        let difference = modifiedFile.length-originalFile.length;

        let locatedFileIDs = [];
        for (n=0;n<sizesArch.length;n++)
        {
            if (sizesArch[n] == originalFile.length) locatedFileIDs.push(n);
        }
        console.log(locatedFileIDs)
        let filteredFileIDs = [];
        for (n=0;n<locatedFileIDs.length;n++)
        {
            if (Buffer.compare
                    (
                        archiveFileOrig.slice
                        (
                        fileOffsetsArch[locatedFileIDs[n]],
                        fileOffsetsArch[locatedFileIDs[n]] + sizesArch[locatedFileIDs[n]]
                        ),
                        originalFile
                    ) == 0
                ) 
            {
                filteredFileIDs.push(locatedFileIDs[n]);
            }
                    
        }
        if (filteredFileIDs.length != 1) console.log(filteredFileIDs+ " file either appears in archive twice or doesn't exist")
        else
        {
            let locatedFileID = filteredFileIDs[0];

            archiveFile.writeInt32BE(archiveFile.length, parameterOffsets[locatedFileID]+0x24);
            archiveFile.writeInt32BE(archiveFile.readInt32BE(parameterOffsets[locatedFileID]+0x20)+difference, parameterOffsets[locatedFileID]+0x20);
            archiveFile = Buffer.concat([
                archiveFile,
                modifiedFile
            ]);
        }
    }
}
let dir = path.join(path.dirname(archiveFileName),'converted')
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}
fs.writeFileSync(path.join(path.dirname(archiveFileName),'converted',path.basename(archiveFileName)), archiveFile);

 
