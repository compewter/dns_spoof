#dns_spoof

A very basic DNS spoofer. Any DNS queries with a domain in DOMAINS environment variable will resolve to the DESTINATION_IP environment variable. These variables can be conveniently set in the .env file.

Very useful for using with [CopyCat](https://github.com/compewter/CopyCat)