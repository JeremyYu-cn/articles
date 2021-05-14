## 无头浏览器是什么

无头(headless)浏览器是一种没有图形界面的web浏览器。   
无头浏览器对于测试web页面特别有用，因为它们能够以与浏览器相同的方式展示和解析HTML，包括页面布局、颜色、字体选择以及JavaScript和Ajax的执行等样式元素，而这些元素在使用其他测试方法时通常不可用。<sup>[\[1\]](https://en.wikipedia.org/wiki/Headless_browser)</sup>

## 无头浏览器能做什么

无头浏览器可以用来做很多事情，包括但不限于：
1. web页面测试
2. web页面截图
3. 将web页面生成pdf文件
4. 测试javascript库
5. 自动提交表单
6. 爬虫

## 如何使用无头浏览器

### 生成pdf文件
使用无头浏览器其实很简单，只要安装了node，其实不需要安装任何库也可以使用。   
以chrome为例，chrome提供了许多命令行指令，其中包括使用无头的形式 `--headless`，[chrome的所有启动参数](https://www.cnblogs.com/yikemogutou/p/12624113.html)   
如果我们需要将网页展示的内容生成为pdf，则需要用到`--print-to-pdf`参数，代码如下:
```javascript
    const process = require('child_process');
    const path = require('path');

    const chromeUrl = path.join('F:', 'application', 'Chrome', 'Application', 'chrome'); // 浏览器路径
    const headLess = '--headless'; // 使用无头浏览器
    const disableGpu = '--disable-gpu'; // 不使用硬件渲染
    const action = '--print-to-pdf'; // 将url保存为pdf
    const outputName = path.resolve(__dirname, 'assets', `${ Date.now() }.pdf`); // 保存文件路径
    const printUrl = 'https://juejin.im'; // 向浏览器输入URL

    // 创建子进程执行命令
    const result = process.spawnSync(chromeUrl, [
      headLess,
      disableGpu,
      `${ action }=${ outputName }`,
      printUrl,
    ])
```
执行后会将网页生成pdf文件保存到指定目录   
![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7711a2d146d544458a76ef8dc4e36cfe~tplv-k3u1fbpfcp-watermark.image)
![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fd3b9964d8b741c39f677cf7701fcee2~tplv-k3u1fbpfcp-watermark.image)

### 生成网页图片
同理如果我们需要生成网页快照，只需将上面代码`--print-to-pdf`改为`--screenshot`
```javascript
    const chromeUrl = path.join('F:', 'application', 'Chrome', 'Application', 'chrome'); // 浏览器路径
    const headLess = '--headless'; // 使用无头浏览器
    const disableGpu = '--disable-gpu'; // 不使用硬件渲染
    const action = '--screenshot'; // 将url保存为图片
    const outputName = path.resolve(__dirname, 'assets', `${ Date.now() }.png`); // 保存文件路径
    const printUrl = 'https://juejin.im'; // 向浏览器输入URL

    // 创建子进程执行命令
    const result = process.spawnSync(chromeUrl, [
      headLess,
      disableGpu,
      `${ action }=${ outputName }`,
      printUrl,
    ])
```

### 抓取网页信息
```javascript
    const process = require('child_process');
    const path = require('path');
    const fs = require('fs');

    const chromeUrl = path.join('F:', 'application', 'Chrome', 'Application', 'chrome'); // 浏览器路径
    const headLess = '--headless'; // 使用无头浏览器
    const disableGpu = '--disable-gpu'; // 不使用硬件渲染
    const action = '--dump-dom'； // 抓取网页信息命令
    const outputName = path.resolve(__dirname, `${ Date.now() }.txt`); // 保存地址
    const printUrl = 'https://juejin.im'; // 向浏览器输入URL

    // 创建子进程执行命令
    const result = process.spawnSync(chromeUrl, [
      headLess,
      disableGpu,
      action,
      printUrl,
    ])
    fs.writeFileSync(outputName, result.stdout.toString());
```

## 无头浏览器库 `puppeteer`
从上面的例子可以看到，其实我们不需要任何插件仅仅需要node和浏览器，就可以调用无头浏览器。但是可以看出来，多且繁杂的启动参数命令使得原生无头浏览器难以使用。因此我们可以使用一些无头浏览器的库简化操作。   
`puppeteer` 是 Chrome 开发团队在 2017 年发布的一个 Node.js 包，用来模拟 Chrome 浏览器的运行。puppeteer 是用js封装操控浏览器的功能。使我们更容易地调用浏览器的功能。   
如：获取网页截图
```javascript
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
  })
  const page = await browser.newPage(); // 创建一个新页面
  await page.goto('https://juejin.im'); // 新页面跳转到知道地址
  await page.screenshot({ // 调用截图功能
    path: path.resolve(__dirname, 'assets', `${ Date.now() }.png`)
  })
  browser.close();
})()
```

将网页转为pdf
```javascript
await page.pdf({
  path: path.resolve(__dirname, 'assets', `${ Date.now() }.pdf`)
})
```

[执行脚本](https://juejin.cn/post/6844903504276881422#heading-6)   
[自动表单提交](https://juejin.cn/post/6844903504276881422#heading-7)

更多的功能点击[这里](https://www.npmjs.com/package/puppeteer)

## 总结

* 无头(headless)浏览器是一种没有图形界面的web浏览器。  
* 无头浏览器可以用来进行web页面测试，网页截图，将网页生成pdf，测试javscript库，自动提交表单，爬虫等功能

### 参考文章

1. [Headless browser, wiki](https://en.wikipedia.org/wiki/Headless_browser)
2. [无头浏览器 Puppeteer 初探](https://juejin.cn/post/6844903504276881422#heading-9)
3. [chrome启动参数大全](https://www.cnblogs.com/yikemogutou/p/12624113.html)
