# README #

Set of utils for testing media buffering, VPN geo localization & other cool stuff

### How do I get set up? ###

- apt-get install dnsmasq
- apt-get install hostapd
- apt-get install libpcap-dev
- apt-get install nodejs (or nodejs-legacy) npm
- npm install

### How to build the hotspot:

- http://www.daveconroy.com/turn-your-raspberry-pi-into-a-wifi-hotspot-with-edimax-nano-usb-ew-7811un-rtl8188cus-chipset/

### How does https sniffer?

Raspberry pi has a haproxy installed that redirects all https requests to domain to an internal service listening @ port 81. All requests are stored in a temporal queue that is accessed via http. How to install haproxy on rpi:

- https://raspberry-hosting.com/en/faq/where-can-i-find-actual-haproxy-and-keepalived-deb-packages-raspberry-pi-and-how-i-install-high

### Who do I talk to? ###

- Adrian Galera