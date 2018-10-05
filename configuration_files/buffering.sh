#!/bin/bash
#silent="> /dev/null 2>&1"
silent="> /dev/null 2>&1"
interface="eth0"
delete="tc qdisc del dev $interface ingress $silent && tc qdisc del dev ifb0 root $silent"
init="modprobe ifb numifbs=1 $silent && ip link set dev ifb0 up $silent"
configureRedirectWlan="tc qdisc add dev $interface handle ffff: ingress && tc filter add dev $interface parent ffff: protocol ip u32 match u32 0 0 action mirred egress redirect dev ifb0 $silent"
configureTrafficShape="tc qdisc add dev ifb0 root handle 1: htb default 10  $silent && tc class add dev ifb0 parent 1: classid 1:1 htb rate %s $silent && tc class add dev ifb0 parent 1:1 classid 1:10 htb rate %s $silent"
startHotspot="service hostapd start"


if [ $1 = "start" ]; then
	bash -c "$startHotspot" #Starts the hotspot if it is not started yet
	#echo $init
	bash -c "$init" #load the ifb module and starts the ifb0 virtual interface

	if [ -z $2  ]; then
		echo "which network condition? regular/bad/very-bad/terribly-bad"
	elif [ $2 = "regular" ]; then
		bw="1mbit"
		echo "Configure for $bw"
		bash -c "$delete" #Delete current configuration in $interface and ifb0
		bash -c "$configureRedirectWlan" #Redirects ingress traffic on wlan0 to ifb0
		traffic=$(printf "$configureTrafficShape" $bw $bw)
		bash -c "$traffic"
		res=`tc qdisc show dev $interface`
		res1=`tc qdisc show dev ifb0`
		echo $res
		echo $res1

    elif [ $2 = "bad" ]; then
		bw="0.5mbit"
		echo "Configure for $bw"
		bash -c "$delete" #Delete current configuration in $interface and ifb0
		bash -c "$configureRedirectWlan" #Redirects ingress traffic on wlan0 to ifb0
		traffic=$(printf "$configureTrafficShape" $bw $bw)
		bash -c "$traffic"
		res=`tc qdisc show dev $interface`
		res1=`tc qdisc show dev ifb0`
		echo $res
		echo $res1


	elif [ $2 = "very-bad" ]; then		
		bw="0.2mbit"
		echo "Configure for $bw"
		bash -c "$delete" #Delete current configuration in $interface and ifb0
		bash -c "$configureRedirectWlan" #Redirects ingress traffic on wlan0 to ifb0
		traffic=$(printf "$configureTrafficShape" $bw $bw)
		bash -c "$traffic"
		res=`tc qdisc show dev $interface`
		res1=`tc qdisc show dev ifb0`
		echo $res
		echo $res1
    
    elif [ $2 = "terribly-bad" ]; then
		bw="0.1mbit"
		echo "Configure for $bw"
		bash -c "$delete" #Delete current configuration in $interface and ifb0
		bash -c "$configureRedirectWlan" #Redirects ingress traffic on wlan0 to ifb0
		traffic=$(printf "$configureTrafficShape" $bw $bw)
		bash -c "$traffic"
		res=`tc qdisc show dev $interface`
		res1=`tc qdisc show dev ifb0`
		echo $res
		echo $res1

	else
		echo "not implemented"
	fi
elif [ $1 = "stop" ]; then
	echo $delete
	bash -c "$delete"
	res=`tc qdisc show dev $interface`;
	res1=`tc qdisc show dev ifb0`;
	echo $res
	echo $res1
else
echo "not valid"
fi
