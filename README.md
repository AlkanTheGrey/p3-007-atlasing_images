# p3-007-atlasing_images
Phaser 3.55.2 Working with atlases.
An atlas is a way of compacting multiple graphic assets onto one image resource,
this reduces the number of calls to fetch resources and makes it easier to ensure
your graphics are loaded.

Most texture packers also export a key that can be in xml or json that describes
the position, rotation, scale, e.t.c of the specific graphic within the atlas.

## Load Atlas

This is done in the preload section, and is achieved by using the loader plugin of
the scene
> this.load.atlas( key, [textureURL], [atlasURL] );

> this.load.atlasXML( key, [textureURL], [atlasURL] );

- **key** - the key to use for this file, [string].
- **textureURL** - url to the image of the atlas.
- **atlasURL** - the url to the atls file, for the atlas() method this is a json
file, while for the atlasXML() this is an xml file.

## Creating Images

Static images can simple be used directly from the xml by using the atlas as the
texture key and giving the index or name of the individual sprite as the frame
argument.

> this.add.image( x, y, *atlas key*, *frame index / name* );

## Creating Sprites

Sprites are a bit more complex as the often have multiple frames, a spritesheet
can be saved on the atlas and extracted as a singular texture using the texture
manager. This textures can also be used for images.

**Step 1** - create a texture from the atlas, this will add the texture to the
texture manager keys. making it accessible using that texture key

``` Javascript
this.textures.addSpriteSheetFromAtlas(
  <texture_key>,
  {
    atlas: <atlas_key>,
    frame: <frame_name> | <frame_index>,
    frameWidth: [number],
    frameHeight: [number],
    startFrame: [number], // default 0
    endFrame: [number], // default -1
    margin: [number],
    spacing: [number]
  }
)
```

**step 2** - now that the spritesheet is accessible using the *texture_key*
set, the spritesheet can be created using the normal code
```Javascript
this.add.sprite( x, y, <texture_key>, <frame> )
```