# Example datasets

These datasets can be used with `xmfa_process.py` to build up a manifest file.

E.g.

```console
python xmfa_process.py example/data.gff example/data.fa example/nucl.xmfa data/nucl/ > example/nucl.json
python xmfa_process.py example/data.gff example/data.fa example/prot.xmfa data/prot/ > example/prot.json
```

And then opening [http://localhost:8080/?url=nucl.json](http://localhost:8080/?url=example/nucl.json) in your browser.
