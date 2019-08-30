#!/usr/bin/python3

import sys, os, re

f = open('newareadata.txt', 'r')
areaRe = re.compile('coords="(.*?)"')
for l in f.readlines():
    areaMatch = areaRe.search(l)
    if areaMatch:
        match = areaMatch.group(1)
        matchCoords = [str(int(x) + (int(x)/50)) for x in match.split(',')]
        print(l[:areaMatch.start(0)] + 'coords="' + ','.join(matchCoords) + '"' + l[areaMatch.end(0):-1])


f.close()

