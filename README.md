site-manager
============

[![Build Status](https://travis-ci.org/Yogu/site-manager.svg?branch=master)](https://travis-ci.org/Yogu/site-manager) [![Coverage Status](https://coveralls.io/repos/Yogu/site-manager/badge.png?branch=master)](https://coveralls.io/r/Yogu/site-manager?branch=master) [![Dependency Status](https://gemnasium.com/Yogu/site-manager.svg)](https://gemnasium.com/Yogu/site-manager) [![Code Climate](https://codeclimate.com/github/Yogu/site-manager.png)](https://codeclimate.com/github/Yogu/site-manager)

You want to develop, test and deploy a website reliably, automating as much as possible and monitor all these tasks?

#### Features

**site-manager**

* manages multiple instances of your website, e.g. **dev, alpha, beta, staging** and **production**
* upgrades sites automatically when you push to certain branches
* migrates databases during upgrade
* creates backups before performing critical operations
* makes sure that tasks do not interfere
* logs every past task

#### Requirements

* You use git with branches for development, production etc.
* All website roots are on the same server or accessible via NFS

#### Customization

This app is intended to be included as a node package into your main application.
You can add custom tasks to adapt it to your workflow.

#### Technology

* node.js for the server
* angular.js for the client
* git for version management and backup

#### License

GPLv2, (c) Jan Melcher, 2014
