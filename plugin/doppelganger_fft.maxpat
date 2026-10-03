{
  "patcher": {
    "fileversion": 1,
    "rect": [
      0,
      0,
      600,
      250
    ],
    "boxes": [
      {
        "box": {
          "id": "in1",
          "maxclass": "newobj",
          "text": "fftin~ 1",
          "patching_rect": [
            30,
            30,
            100,
            22
          ]
        }
      },
      {
        "box": {
          "id": "re1",
          "maxclass": "newobj",
          "text": "*~",
          "patching_rect": [
            30,
            80,
            45,
            22
          ]
        }
      },
      {
        "box": {
          "id": "im1",
          "maxclass": "newobj",
          "text": "*~",
          "patching_rect": [
            110,
            80,
            45,
            22
          ]
        }
      },
      {
        "box": {
          "id": "sum1",
          "maxclass": "newobj",
          "text": "+~",
          "patching_rect": [
            30,
            120,
            45,
            22
          ]
        }
      },
      {
        "box": {
          "id": "write1",
          "maxclass": "newobj",
          "text": "poke~ #1",
          "patching_rect": [
            30,
            160,
            140,
            22
          ]
        }
      },
      {
        "box": {
          "id": "in2",
          "maxclass": "newobj",
          "text": "fftin~ 2",
          "patching_rect": [
            290,
            30,
            100,
            22
          ]
        }
      },
      {
        "box": {
          "id": "re2",
          "maxclass": "newobj",
          "text": "*~",
          "patching_rect": [
            290,
            80,
            45,
            22
          ]
        }
      },
      {
        "box": {
          "id": "im2",
          "maxclass": "newobj",
          "text": "*~",
          "patching_rect": [
            370,
            80,
            45,
            22
          ]
        }
      },
      {
        "box": {
          "id": "sum2",
          "maxclass": "newobj",
          "text": "+~",
          "patching_rect": [
            290,
            120,
            45,
            22
          ]
        }
      },
      {
        "box": {
          "id": "write2",
          "maxclass": "newobj",
          "text": "poke~ #2",
          "patching_rect": [
            290,
            160,
            140,
            22
          ]
        }
      }
    ],
    "lines": [
      {
        "patchline": {
          "source": [
            "in1",
            0
          ],
          "destination": [
            "re1",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "in1",
            0
          ],
          "destination": [
            "re1",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "in1",
            1
          ],
          "destination": [
            "im1",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "in1",
            1
          ],
          "destination": [
            "im1",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "re1",
            0
          ],
          "destination": [
            "sum1",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "im1",
            0
          ],
          "destination": [
            "sum1",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "sum1",
            0
          ],
          "destination": [
            "write1",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "in1",
            2
          ],
          "destination": [
            "write1",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "in2",
            0
          ],
          "destination": [
            "re2",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "in2",
            0
          ],
          "destination": [
            "re2",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "in2",
            1
          ],
          "destination": [
            "im2",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "in2",
            1
          ],
          "destination": [
            "im2",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "re2",
            0
          ],
          "destination": [
            "sum2",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "im2",
            0
          ],
          "destination": [
            "sum2",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "sum2",
            0
          ],
          "destination": [
            "write2",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "in2",
            2
          ],
          "destination": [
            "write2",
            1
          ]
        }
      }
    ]
  }
}