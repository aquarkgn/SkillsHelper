usage: hermes plugins [-h]
                      {install,update,remove,rm,uninstall,list,ls,enable,disable}
                      ...

Install plugins from Git repositories, update, remove, or list them.

positional arguments:
  {install,update,remove,rm,uninstall,list,ls,enable,disable}
    install             Install a plugin from a Git URL or owner/repo
    update              Pull latest changes for an installed plugin
    remove (rm, uninstall)
                        Remove an installed plugin
    list (ls)           List installed plugins
    enable              Enable a disabled plugin
    disable             Disable a plugin without removing it

options:
  -h, --help            show this help message and exit
