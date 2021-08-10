## 什么是 docker

    Docker是一个开源的引擎，可以轻松的为任何应用创建一个轻量级的、可移植的、自给自足的容器。
    开发者在笔记本上编译测试通过的容器可以批量地在生产环境中部署，
    包括VM（虚拟机）、bare metal、OpenStack 集群和其他的基础应用平台。

docker 是一个容器，它能在一个主机中虚拟出一个或多个`相对独立(文件，网络等独立)`的环境，例如：在一台主机中虚拟出两个相对独立操作系统。

## docker 概念

docker 的安装非常便捷，通常都是一键安装，这里就不多介绍了，具体可以查看[官方文档](https://docs.docker.com/get-docker/)  
docker 的核心概念是`镜像`，`容器`，`仓库`。**卷**和**网络**主要负责管理容器间的数据和网络，下面就来介绍 docker 的概念

### 镜像(image)

镜像是 docker 的核心概念之一。镜像可以简单地理解为：提供最基础服务的系统，本质上是一个文件系统。镜像中包含运行系统所需要的程序，文件，配置等数据。

对镜像的操作介绍

- 查看镜像列表

  ```docker
      # 列出所有镜像列表
      docker image ls

      # 列出所有镜像列表
      docker images
  ```

  `docker image ls`和`docker images`两个命令都可以执行返回所有镜像的列表，执行后返回如下:

  ```docker
  REPOSITORY   TAG       IMAGE ID       CREATED        SIZE
  node         latest    d1b3088a17b1   2 months ago   908MB
  redis        latest    fad0ee7e917a   2 months ago   105MB
  nginx        latest    d1a364dc548d   2 months ago   133MB
  mysql        latest    c0cdc95609f1   2 months ago   556MB
  centos       latest    300e315adb2f   7 months ago   209MB
  ```

- 拉取镜像

  [DockerHub](https://hub.docker.com/)中提供了非常多的镜像，就像`npm`库一样，用户可以随意拉取 dockerhub 上的镜像

  ```docker
      docker image pull [OPTIONS] NAME[:TAG|@DIGEST]
      # 可选参数 OPTIONS
      #  -a, --all-tags 拉取所有匹配名字的镜像
      #      --disable-content-trust 跳过镜像验证 (default true)
      #      --platform string 如果服务器支持多平台，则可以设置平台
  ```

  如果需要下载`node`镜像，则输入命令`docker pull node`，下载成功后使用`docker images`命令查看下载的镜像。

- 运行镜像

  当镜像创建完成后，下面就来运行镜像，运行镜像使用的是`docker run`

  ```
      docker run --name node-container -it node /bin/bash
  ```

  `docker run`是一个运行 docker 镜像的命令具体的参数也是有点多，详细的运行参数可以参考[这里](https://yeasy.gitbook.io/docker_practice/container/run)。  
   运行成功后会在**容器**中查看到。

镜像中还有其他许多命令，例如：

- 删除镜像 `docker image rm`
- 引入镜像 `docker image import`
- 提交镜像 `docker image push`
  等等

在这里简单地介绍了 docker 的镜像，如果想深入地了解镜像，可以点击这里[了解](https://yeasy.gitbook.io/docker_practice/image)

### 容器(container)

容器 docker 的第二个核心概念。可以简单地理解为一个应用。这些容器都是运行镜像后生成的应用，一个镜像可以生成多个容器，并且他们可以相互独立或关联起来。

容器的主要操作

- 运行
  在介绍镜像的运行的时候已经介绍过，使用`docker run [imageName]`创建并运行一个容器。
- 停止
  ```docker
      # 停止容器命令 可以使用容器名或者ID索引容器
      docker container stop [containerName | containerId]
  ```
- 删除容器
  ```docker
      docker container rm [containerName | containerId]
  ```
  需要注意的是，**正在运行的容器不能被删除**，被删除的容器必须在停止状态
- 进入容器  
   进入容器使用的是`docker exec`命令，[了解更多 exec 命令](https://yeasy.gitbook.io/docker_practice/container/attach_exec)
  ```docker
      # 进入容器
      docker exec -it [containerName | containerId] [command]
  ```
- 导出和导入容器
  ```docker
      # 导出容器
      docker export [containerID | containerName] > [outputName].tar
      # 导入容器
      docker import [target]
  ```

### 仓库(repository)

仓库是 docker 的第三个核心概念。  
想象一下，当我们在一台主机中部署环境完成后，如果我想在另一台主机上部署相同的环境。那么我只要把部署好的这个仓库放到仓库中，然后在另一台主机拉取这个镜像运行就可以了，非常的方便快捷。  
仓库的核心是`push`和`pull`。[了解更多](https://yeasy.gitbook.io/docker_practice/repository/dockerhub)

### 网络(network)

默认情况下 docker 创建的容器是互不关联的，如果我们想要把两个网络放到一个局域网中，那么就需要用到 docker 的网络。  
网络常用的命令有:

- 创建 `docker network create [networkName]`
- 查看网络 `docker network ls`
- 删除网络 `docker network rm [networkName | id]`

大概的创建流程是：先创建一个网络，在创建容器时将容器指定到这个网络中。具体的网络命令：

```docker
    # 创建一个网络
    docker network create my-network

    # 创建容器node_1，并将容器放在新创建的网络中
    docker run --network my-network -d -it --name node_1 node

    # 创建容器node_2，并将容器放在新创建的网络中
    docker run --network my-network -d -it --name node_2 node

```

创建完成后进入容器**node_1** `dokcer exec -it node_1`，查看一下与容器**node_2**是否在同一个局域网中。  
使用 ping 命令`ping node_2`

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e1c20f587ee14e2fab82d42faca3f631~tplv-k3u1fbpfcp-watermark.image)

这样，两个网络就连接起来了。

### 卷(volumn)

docker 默认容器除了网络独立，文件也是独立的，如果想要浏览容器外部文件，或者两个容器共享文件，那么就需要用到**卷（volume）**。
卷的常用操作有：

- 创建卷 `docker volume create [option] [volumeName]`
- 查看卷列表 `docker volume ls`
- 查看卷详情 `docker volume inspect [volumeName]`
- 删除卷 `docker volume rm [volumeName]`

使用卷：使用卷需要在运行容器的时候就将卷与容器绑定起来。绑定命令  
`docker run -v [volumeName] [targetPath] -d -it [imageName]`  
例如：使两个容器都可以访问容器外部的一个文件路径可以这样做

```docker
    # 创建一个卷
    docker volume create my-volume

    # 创建一个容器node_1，并指定容器的卷和目标路径
    docker run -v my-volume /share --name node_1 -d -it node

    # 创建一个容器node_2，并指定容器的卷和目标路径
    docker run -v my-volume /share --name node_2 -d -it node
```

上面命令大概的意思是创建一个卷，再创建两个容器，这两个容器有一个共同的卷，并映射在容器内部的`/share`路径中。
完成后进入容器会生成`/share`这个目录

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/94b22779d4bf4ff7a58e8c5675e3609c~tplv-k3u1fbpfcp-watermark.image)

## 使用 docker 搭建一个 web 服务

介绍完 docker 概念和用法，现在就可以开始实战啦，我们的目标是使用 docker 搭建一个 web 服务。  
需要使用到**nginx**和**node**镜像

首先用 node 写一个 web 服务

```javascript
const http = require("http");

const app = http.createServer((req, res) => {
  res.end("Hello Docker");
});

app.listen(8080, () => {
  console.log("server running at 8080");
});
```

然后创建容器

```docker
    # 拉取nginx和node镜像
    docker image pull nginx node

    # 创建网络
    docker network create my-network

    # 创建卷
    docker volumn create my-volume

    # 创建nginx容器
    docker run nginx -v my-colume:/share --network my-network -it -d -p 80:80 --name nginx nginx /bin/bash

    # 创建node容器
    docker run -it -v my-volume:/share --network my-network -it -d --name node node /bin/bash

    # 将web服务文件放入共享卷中

    # 执行node服务
    docker exec -it node node /share/index.js &

    # 修改nginx配置，将80端口指向node服务
    server {
        listen 80;
        server_name test;

        location / {
            http_proxy http://node:8080;
        }
    }
```

这样，访问服务器 80 端口就可以访问到 node 服务了~

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7f997da9c316465fbdb2c64bf4d5bcbc~tplv-k3u1fbpfcp-watermark.image)

## 小结

本文主要介绍了 docker 是什么，docker 的三个核心（镜像，容器，仓库），还有介绍了网络和卷。  
最后利用 docker 和 node 搭建了一个 web 服务。

## 参考

1.[docker 中文网](https://www.docker.org.cn/book/docker/what-is-docker-16.html)  
2.https://www.docker.com  
3.[Docker—从入门到实践](https://yeasy.gitbook.io/docker_practice/introduction)
