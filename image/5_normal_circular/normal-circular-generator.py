# This script generates circular versions of 1_normal/mob/* for
# the Super and Unique rarity mobs only.
# This script should be run after modifying assets in 1_normal/mob/*.
# Run it from the root of this repository.
# Written by squishycat92 (@teddybear0029).

import os
from PIL import Image, ImageDraw
from typing import Literal

normalBasePath = "./image/1_normal/mob"
circularBasePath = "./image/5_normal_circular/mob"

superOutlineColor = "#23CF84"
uniqueOutlineColor = "#454545"

center = (512, 512)
radius = 500

circleMask = Image.new("L", (1024, 1024), 0)
draw = ImageDraw.Draw(circleMask)
# Alternatively the values can be hardcoded as (0, 0) and (1024, 1024)
draw.ellipse(
    [(center[0] - radius, center[1] - radius), (center[0] + radius, center[1] + radius)],
    fill=255)


def CreateCircularMobImage(mobImage: Image.Image, rarity: Literal["super", "unique"]) -> Image.Image:
    """
    Creates a circular version of the mob image object given the base mob image.
    :param mobImage: An Image.Image object representing the base mob image.
    :param rarity: The rarity of this mob image. This is used to determine the new outline's color.
    :return Another Image.Image object representing the mob image cropped into a circle with a matching rarity outline.
    """
    if rarity == "super":
        outlineColor = superOutlineColor
    elif rarity == "unique":
        outlineColor = uniqueOutlineColor
    else:
        raise ValueError

    draw = ImageDraw.Draw(mobImage)
    # Alternatively the values can be hardcoded as (0, 0) and (1024, 1024)
    draw.ellipse(
        [(center[0] - radius, center[1] - radius), (center[0] + radius, center[1] + radius)],
        outline=outlineColor,
        width=80)
    mobImage.putalpha(circleMask)

    return mobImage

for rarityDirectory in os.listdir(normalBasePath):
    if rarityDirectory.startswith("."):
        continue

    elif rarityDirectory not in ["super", "unique"]:
        continue

    for mobFile in os.listdir(f"{normalBasePath}/{rarityDirectory}"):
        if mobFile.startswith("."):
            continue

        print(f"Processing base image: {normalBasePath}/{rarityDirectory}/{mobFile}")
        baseImage = Image.open(f"{normalBasePath}/{rarityDirectory}/{mobFile}")
        circularImage = CreateCircularMobImage(baseImage, rarityDirectory)
        circularImage.save(f"{circularBasePath}/{rarityDirectory}/{mobFile}")
        print(f"Successfully saved generated image to: {circularBasePath}/{rarityDirectory}/{mobFile}")