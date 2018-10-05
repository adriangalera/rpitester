#startup script to execute hostapd
#in order to run it at boot:
#cp hostapd.sh /etc/init.d/hostapd.sh
#chmod +x /etc/init.d/mystartu.sh
#update-rc.d hostapd.sh defaults 100



#!/bin/bash
echo "Setting up hostapd..."
hostapd -dd /etc/hostapd/hostapd.conf > /var/log/hostapd.log & 
