//  PathifyUITests.swift

import XCTest

class PathifyUITests: XCTestCase {

    override func setUp() {
        // Put setup code here. This method is called before the invocation of each test method in the class.

        // In UI tests it is usually best to stop immediately when a failure occurs.
        continueAfterFailure = false

        // In UI tests it’s important to set the initial state - such as interface orientation - required for your tests before they run. The setUp method is a good place to do this.
    }

    override func tearDown() {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }

    func testExample() {
        // UI tests must launch the application that they test.
        let app = XCUIApplication()

        // Note launchEnvironment comes through as props to the App component on the react-native side once launched.
        // let testBundle = Bundle(for: type(of: self))
        // var index = 0
        // var samples: [String : String] = [:]
        // repeat {
        //   let name = "sample" + String(index)
        //   guard let asset = NSDataAsset(name: name, bundle: testBundle) else {
        //     break; // this is ok, we are simply done with samples
        //   }
        //   // TODO this json is too long to fit in the launchEnvironment!
        //   // let json = String(decoding: asset.data, as: UTF8.self)
        //   samples[name] = name
        //   index += 1
        // } while true
        // app.launchEnvironment = samples
        
        setupSnapshot(app)

        app.launch()

        // Use recording to get started writing UI tests.
        // Use XCTAssert and related functions to verify your tests produce the correct results.
        sleep(10)
        snapshot("uitest1")

        // sleep(5)
        // snapshot("uitest2")
    }

    // func testLaunchPerformance() {
    //     if #available(macOS 10.15, iOS 13.0, tvOS 13.0, *) {
    //         // This measures how long it takes to launch your application.
    //         measure(metrics: [XCTOSSignpostMetric.applicationLaunch]) {
    //             XCUIApplication().launch()
    //         }
    //     }
    // }
}
