# WaterGem

Easily find and refill your most precious scarce resource while saving money and the environment.

# Description

In Thailand, the tap water is unsafe for human consumption.  To survive, tourists buy expensive bottled water, hurting both their wallets and the environment.

However, there is a better solution: Locals drink water from reverse osmosis water stations, which are both much cheaper and much better for than the environment than bottled water while offering the same water quality.

There are three reasons tourists do not use these water refill stations: 1) Tourists don't know about the stations, 2) the stations are hard to find, and 3) tourists are unsure of the water quality from these stations.

WaterGem solves all three of these problems by helping users easily locate the water stations -- the hidden gems that can refill a 1.5 liter bottle with clean, safe drinking water for 1 baht (about 3 US cents).

# Using the App

To get started using the app, you can go to the live website, or you can download this repo and run the program locally.

To run the website locally, you need to have both of the following installed: 1) Python 2.7 and 2) the Google App Engine SDK for Python.  Here are complete instructions for running the app locally:

1. Ensure you have Python 2.7 installed and active on your machine (don't use a higher version of Python -- you can download Python 2.7 from the [Python website](https://www.python.org/download/releases/2.7.4)).
2. If you are working on a Linux or Mac OS X machine:
    1. Download [the Mac/Linux version of the Google App Engine SDK for Python](https://storage.googleapis.com/appengine-sdks/featured/google_appengine_1.9.40.zip).
    2. Unzip the App Engine SDK file you downloaded (google_appengine_1.9.40.zip).  One way to do it is with the following command line command: `unzip google_appengine_1.9.40.zip`.  There is no App Engine installation script that you need to run after unzipping the files.
    3. Add the google_appengine directory to your PATH with the following command line command: `export PATH=$PATH:/path/to/google_appengine/
    4. Make sure Python 2.7 is installed on your machine using the following command line command: `/usr/bin/env python -V`.  The output should look like this: `Python 2.7.<number>`. If Python 2.7 isn't installed, install it now (as stated in the first step) using the installation instructions for your Mac/Linux distribution for Python 2.7 [here](https://www.python.org/download/releases/2.7.4).
3. If you are working on a Windows Machine:
    1. Download [the Windows version of the Google App Engine SDK for Python](https://storage.googleapis.com/appengine-sdks/featured/GoogleAppEngine-1.9.40.msi).
    2. Double-click the SDK file you downloaded (GoogleAppEngine-1.9.40.msi) and follow the prompts to install the SDK.
    3. You will need Python 2.7 to use the App Engine SDK, because the [Development Server](https://cloud.google.com/appengine/docs/php/tools/devserver) is a Python application. As stated in the first step above, you can download Python 2.7 [here](https://www.python.org/download/releases/2.7.4).
4. Download all of the files in this repo into the same directory.
5. Navigate to that folder on the command line.
6. At the command line, run the command `dev_appserver.py .` (note the space followed by a '.').
7. In a web browser, navigate to [http://localhost:8080/home].

If you have trouble installing ths Google App Engine SDK for Python, you can view the documentation [here](https://cloud.google.com/appengine/downloads#Google_App_Engine_SDK_for_Python).

To visit the live website, go to one of the following addresses:

1. For the secure website that allows location services (e.g., finding your location and getting directions), go to: [https://water-gem.appspot.com/home]
2. For the unsecured website that does not allow location services, go to: [http://water-gem.appspot.com/home]

Any feedback about your experience using the app is welcome.  Please send feedback to [ryanwc13@gmail.com](mailto:ryanwc13@gmail.com).

# License

Created by Ryan William Connor in August 2016.  
Copyright © 2016 Ryan William Connor. All rights reserved.