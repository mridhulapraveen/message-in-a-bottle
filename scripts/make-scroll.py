from PIL import Image

W, H = 96, 48
im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
px = im.load()

paper = (232, 196, 138, 255)
hi = (244, 222, 180, 255)
lo = (214, 170, 104, 255)
wood = (138, 90, 48, 255)
dk = (90, 54, 28, 255)
lt = (214, 164, 104, 255)
edge = (74, 44, 22, 255)

def rect(x0, y0, x1, y1, color):
    for y in range(y0, y1):
        for x in range(x0, x1):
            px[x, y] = color

# parchment
rect(16, 8, 80, 40, paper)
rect(16, 8, 80, 11, wood)
rect(16, 11, 80, 13, hi)
rect(16, 36, 80, 38, lo)
rect(16, 38, 80, 40, wood)

def roll(x, flip=False):
    bands = [edge, dk, wood, lt, hi, paper, lo, wood, dk, edge]
    for i, color in enumerate(bands):
        col = x + (len(bands) - 1 - i if flip else i)
        rect(col, 3, col + 1, 45, color)
    cap = edge
    rect(x, 3, x + len(bands), 6, cap)
    rect(x + 2, 4, x + len(bands) - 2, 5, lt)
    rect(x, 42, x + len(bands), 45, cap)
    rect(x + 2, 43, x + len(bands) - 2, 44, wood)

roll(2, False)
roll(84, True)

im.save("public/frame-scroll.png")
