resource = GetCurrentResourceName()
version = GetResourceMetadata(resource, "version", 0)
author = GetResourceMetadata(resource, "author", 0)

Utils.server.print_logo()