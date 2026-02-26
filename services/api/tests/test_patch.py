from app.patch_utils import apply_patch, parse_unified_diff
from app.services.patch_validator import validate_patch


def test_parse_and_apply_simple():
    patch = """--- a/foo.txt
+++ b/foo.txt
@@ -1,3 +1,4 @@
 line1
+new line
 line2
"""
    patches = parse_unified_diff(patch)
    assert len(patches) == 1
    assert patches[0].path == "foo.txt"
    original = "line1\nline2\n"
    result = apply_patch(original, patches[0])
    assert "new line" in result
    assert result == "line1\nnew line\nline2\n"


def test_validate_patch_ok():
    patch = """--- a/foo.py
+++ b/foo.py
@@ -1,2 +1,3 @@
 def foo():
+    pass
     return 1
"""
    valid, msg, changes = validate_patch(patch)
    assert valid
    assert len(changes) == 1
    assert changes[0]["path"] == "foo.py"


def test_validate_patch_blocked_path():
    patch = """--- a/.env
+++ b/.env
@@ -1 +1,2 @@
 X=1
+Y=2
"""
    valid, msg, _ = validate_patch(patch)
    assert not valid
    assert "Blocked" in msg


def test_validate_patch_secrets():
    patch = """--- a/config.py
+++ b/config.py
@@ -1 +1,2 @@
 x = 1
+key = "sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
"""
    valid, msg, _ = validate_patch(patch)
    assert not valid
    assert "secret" in msg.lower()
