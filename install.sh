#!/bin/bash
echo "**** Change default password for user pi"
su -c "passwd pi"
echo "**** Getting the required services"
apt-get update
apt-get install dnsmasq hostapd libpcap-dev nodejs-legacy npm vim openvpn haproxy
echo "**** Getting nodejs required services"
npm install

echo "**** Copy the configuration files"
#configuration files
#dnsmasq
touch /etc/dnsmasq.hosts
cp configuration_files/dnsmasq.conf /etc/dnsmasq.conf
#hostapd
cp configuration_files/hostapd.conf /etc/hostapd/hostapd.conf
cp configuration_files/hostapd.sh /etc/init.d/hostapd.sh
update-rc.d hostapd.sh defaults
#buffering
cp configuration_files/buffering.sh /home/pi/.
#haproxy
cp configuration_files/haproxy.cfg /etc/haproxy/haproxy.cfg
cp -r configuration_files/certs /etc/ssl/private/certs
#vpn
cp -r configuration_files/vpns /opt/vpns
#intefaces
cp configuration_files/interfaces /etc/network/interfaces
#iptables
cp configuration_files/iptables.ipv4.nat /etc/iptables.ipv4.nat

touch /tmp/buffering
touch /tmp/blockedips
touch /tmp/vpninfo

echo "**** All configuration files copied"

echo "**** Configuring iptables"
sh iptables.nat.vpn

echo "**** Get and execute pm2"
npm install pm2 nodemon -g
pm2 start /home/pi/rpitester/bin/www
pm2 startup ubuntu

