import Foundation
import UIKit
@objc public class PathifyNative: NSObject {
  public override init() {
    super.init()
  }

  deinit {
  }

  // This just tests whether the Swift bridging header magically summoned via @objc is working.
  @objc public static func foo() -> String {
    return "bar"
  }

  @objc public static func loadSampleData(props: NSMutableDictionary) {
    // print(props)

    let mainBundle = Bundle.main
    var index = 0
    // var samples: [String : String] = [:]
    repeat {
      let name = "sample" + String(index)
      guard let asset = NSDataAsset(name: name, bundle: mainBundle) else {
        break; // this is ok, we are simply done with samples
      }
      // We have sample data, which never ships with the production app, only with PathifyTest app, hence testMode.
      print("Stringifying sample data: " + name)
      // Note this json is too long to fit in the launchEnvironment!
      let json = String(decoding: asset.data, as: UTF8.self)
      props[name] = json
      props["automate"] = true // This will spur automated tests.
      props["test"] = true // This will spur testMode, which won't run anything automatically unless automate is true.
      index += 1
    } while true    
  }
}
