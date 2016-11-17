# Example datasets

These datasets can be used with `xmfa_process.py` to build up a manifest file.

E.g.

```console
$ python xmfa_process.py example/prot.fa example/prot.gff example/prot.xmfa output/protein/ > example/protein_manifest.json
```

And then opening [http://localhost:8080/?url=protein_manifest.json](http://localhost:8080/?url=example/protein_manifest.json) in your browser.
