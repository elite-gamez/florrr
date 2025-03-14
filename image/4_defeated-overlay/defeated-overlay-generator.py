# This script merges all the picture contents of 1_normal/mob/* with the
# defeated_overlay.png file in the same directory as this file.
# This script should be run after modifying assets in 1_normal/mob/*.
# Run it from the root of this repository.
# Written by squishycat92 (@teddybear0029).

import os
from PIL import Image

normalBasePath = "./image/1_normal/mob"
defeatedBasePath = "./image/4_defeated-overlay/mob"

def CreateDefeatedMobImage(mobImage: Image.Image) -> Image.Image:
    """
    Creates a defeated mob image object given the base mob image.
    :param mobImage: An Image.Image object representing the base mob image.
    :return Another Image.Image object representing the mob image with a defeated marker (X) over it.
    """
    defeatedOverlay = Image.open("./image/4_defeated-overlay/defeated_overlay.png")
    defeatedMobImage = Image.alpha_composite(mobImage, defeatedOverlay)
    return defeatedMobImage

for rarityDirectory in os.listdir(normalBasePath):
    if rarityDirectory.startswith("."):
        continue

    for mobFile in os.listdir(f"{normalBasePath}/{rarityDirectory}"):
        if mobFile.startswith("."):
            continue

        baseImage = Image.open(f"{normalBasePath}/{rarityDirectory}/{mobFile}")
        defeatedImage = CreateDefeatedMobImage(baseImage)
        defeatedImage.save(f"{defeatedBasePath}/{rarityDirectory}/{mobFile}")
        print(f"Successfully saved generated image to: {defeatedBasePath}/{rarityDirectory}/{mobFile}")