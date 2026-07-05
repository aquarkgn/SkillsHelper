usage: hermes doctor [-h] [--fix] [--ack ADVISORY_ID]

Diagnose issues with Hermes Agent setup

options:
  -h, --help         show this help message and exit
  --fix              Attempt to fix issues automatically
  --ack ADVISORY_ID  Acknowledge a security advisory by ID and exit. After
                     ack, the advisory will no longer trigger startup banners.
                     Run `hermes doctor` first to see active advisories and
                     their IDs.
