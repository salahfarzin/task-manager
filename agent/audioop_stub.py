"""Stub audioop module for Python 3.13+.

The built-in ``audioop`` module was removed in Python 3.13 (PEP 594).
``pydub`` imports it at module level for audio processing features that are
never used by aider (code editing). This stub satisfies the import so
pydub and aider load correctly without any functional audio capability.

Installed automatically by ``make fix-pydub`` (called from ``make install``).
"""


class error(Exception):
    pass


# No-op stubs for the functions pydub references at import time.
def add(fragment1, fragment2, width): ...
def adpcm2lin(fragment, width, state): return b"", None
def alaw2lin(fragment, width): return b""
def avg(fragment, width): return 0
def avgpp(fragment, width): return 0
def bias(fragment, width, bias): return b""
def byteswap(fragment, width): return b""
def cross(fragment, width): return 0
def findfactor(fragment, reference): return 0.0
def findfit(fragment, reference): return (0, 0.0)
def findmax(fragment, length): return 0
def getsample(fragment, width, index): return 0
def lin2adpcm(fragment, width, state): return b"", None
def lin2alaw(fragment, width): return b""
def lin2lin(fragment, width, newwidth): return b""
def lin2ulaw(fragment, width): return b""
def max(fragment, width): return 0
def maxpp(fragment, width): return 0
def minmax(fragment, width): return (0, 0)
def mul(fragment, width, factor): return b""
def ratecv(fragment, width, nchannels, inrate, outrate, state, weightA=1, weightB=0):
    return b"", None
def reverse(fragment, width): return b""
def rms(fragment, width): return 0
def tomono(fragment, width, lfac, rfac): return b""
def tostereo(fragment, width, lfac, rfac): return b""
def ulaw2lin(fragment, width): return b""
