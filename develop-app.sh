#!/bin/bash
cd shared; yarn watch; cd ..
cd server/sample; yarn watch; cd ../..
cd app; yarn start; cd ..
