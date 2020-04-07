# Drakengard 3 .xxx Importer
Designed to import edited files into Drakengard 3 .xxx archives. 
Potentially may work with other UE3 UPK archives.


## Usage

- Use [Unreal Package Decompressor](https://www.gildor.org/downloads) on an .xxx archive;
- Extract archive using [Unreal Package Extractor](https://www.gildor.org/downloads);
- Copy extracted folder and rename it;
- Make necessary changes to files in a copied folder;
    - **Amount of files in modded folder has to be the same as original folder** 
- Use importer like this:
```sh
Drakengard3Importer.exe CleanFolder ModifiedFolder DecompressedArchive.XXX
```

## Thanks

- [Gildor](https://www.gildor.org/)
- Andrew McRae
