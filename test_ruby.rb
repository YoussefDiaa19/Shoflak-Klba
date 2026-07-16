privacy_file_path = "PrivacyInfo.xcprivacy"
File.write(privacy_file_path, <<~XML
      <?xml version="1.0" encoding="UTF-8"?>
      <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
      <plist version="1.0">
      <dict/>
      </plist>
XML
)
puts File.read(privacy_file_path)
