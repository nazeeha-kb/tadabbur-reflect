import pathlib
import re

root = pathlib.Path(__file__).resolve().parent.parent
pat = re.compile(r"<p[^>]*>|</p>|<div[^>]*>|</div>", re.I)
ext = {".js", ".jsx", ".ts", ".tsx"}
found = False

for path in sorted(root.rglob("*")):
    if path.suffix.lower() in ext:
        text = path.read_text(encoding="utf-8")
        stack = []
        for m in pat.finditer(text):
            tag = m.group(0).lower()
            if tag.startswith("<p") and not tag.startswith("</"):
                stack.append(m.start())
            elif tag == "</p>" and stack:
                start = stack.pop()
                segment = text[start:m.end()]
                if "<div" in segment.lower():
                    print(path)
                    print(segment.replace("\n","\\n"))
                    found = True
                    break

if not found:
    print("NO_MATCH")
