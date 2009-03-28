#!/usr/bin/python

import sys, os, re

f = open('areadata.txt', 'r')
areaRe = re.compile('coords="(.*?)"')
for l in f.readlines():
    areaMatch = areaRe.search(l)
    if areaMatch:
        match = areaMatch.group(1)
        matchCoords = [str(2*int(x)) for x in match.split(',')]
        print l[:areaMatch.start(0)] + 'coords="' + ','.join(matchCoords) + '"' + l[areaMatch.end(0):-1]


f.close()

