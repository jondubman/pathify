/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>

// https://medium.com/@hr.hseyin_80381/rctbridge-required-dispatch-sync-to-load-rctdevloadingview-error-fix-ba734cced787
#if RCT_DEV
#import <React/RCTDevLoadingView.h>
#endif

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  NSURL *jsCodeLocation;

// https://facebook.github.io/react-native/docs/running-on-device
#ifdef DEBUG
  jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#else
  jsCodeLocation = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif

  RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:jsCodeLocation
    moduleProvider:nil
    launchOptions:launchOptions];

#if RCT_DEV
[bridge moduleForClass:[RCTDevLoadingView class]];
#endif

  RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                                      moduleName:@"Pathify"
                                               initialProperties:nil
                                                   launchOptions:launchOptions];
  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];

  // Pro Tip
  // As your App Bundle grows in size, you may start to see a white screen flash between your splash screen and the
  // display of your root application view. If this is the case, you can add the following code to AppDelegate.m
  // in order to keep your splash screen displayed during the transition.
  // Place this code after "[self.window makeKeyAndVisible]" and before "return YES;"
  UIView* launchScreenView = [[[NSBundle mainBundle] loadNibNamed:@"LaunchScreen" owner:self options:nil] objectAtIndex:0];
  launchScreenView.frame = self.window.bounds;
  rootView.loadingView = launchScreenView;

  return YES;
}

// https://stackoverflow.com/questions/54883304/unable-to-find-module-for-eventdispatcher-react-native/56160671#56160671
#if RCT_DEV
- (BOOL)bridge:(RCTBridge *)bridge didNotFindModule:(NSString *)moduleName {
  return YES;
}
#endif

@end
