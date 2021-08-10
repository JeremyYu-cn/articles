## 了解 esbuild

### esbuild 是什么

esbuild 官方描述的作用就是：`一个JavaScript的打包和和压缩工具`。  
esbuild 使用**golang**开发，在打包的速度上非常快，我们熟悉的`vite`工具在**dev 模式**下就是使用 esbuild 进行打包。

### esbuild 的主要特征

- 在没有缓存的情况也能有极致的性能
- 支持 ES6 的 Tree shaking
- 原生支持 typescript 和 jsx 打包
- 支持 Source Map
- 代码压缩
- 支持定义插件

### 打包速度比较

esbuild 最主要的一个特征就是**有极致的性能**，那么它到底有多快，参考 esbuild 官方提供的一张图

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/482640e887a8458289c49f9f58f63656~tplv-k3u1fbpfcp-watermark.image)
可以看到，esbuild 的性能跟现在主流的打包工具相比，速度比他们快超过 100 倍。可见它在性能方面有多可怕。  
因为现在主流的打包工具底层上执行还是在 js 的执行环境中，cpu 不能充分地得到使用，所以就会导致执行速度慢。

## esbuild 使用

了解完 esbuild 概念，接下来了解一下如何使用 esbuild 的一些主要概念

### API

- `transform`  
   `transform`就是转换的意思，调用这个 API 能将`ts`，`jsx`等文件转换为 js 文件。  
   支持的文件有:
  ```javascript
  export type Loader =
    | "js"
    | "jsx"
    | "ts"
    | "tsx"
    | "css"
    | "json"
    | "text"
    | "base64"
    | "file"
    | "dataurl"
    | "binary"
    | "default";
  ```
  使用 transform
  首先我们创建一个测试的 TS 文件
  ```typescript
  // test.ts
  const str: string = "Hello World";
  ```
  使用`transform`转换为 js
  ```javascript
      // cli
      exbuild ./test.ts --loader=ts // 输出 const str = 'Hello World';

      // js api调用
      const esbuild = require('esbuild');
      const fs = require('fs');
      const path = require('path');
      const filePath = path.resolve(__dirname, 'test.ts');
      const code = esbuild.transformSync(fs.readFilesync(filePath), {
          loader: 'ts',
      })
      console.log(code);
      // 输出
      // {
      //  code: 'const str = 'Hello World'',
      //  map: '',
      //  warnings: []
      // }
  ```
  transform 还可以在转换代码的同时进行**压缩代码(minify)**，**制定代码的模块类型(format)** 等等，部分的的配置如下:
  ```typescript
  interface TransformOptions {
    // 源代码的类型
    loader?: Loader;
    // 代码顶部注入代码
    banner?: string;
    // 代码底部注入代码
    footer?: string;

    // sourcemap相关配置
    sourcemap?: boolean | "inline" | "external" | "both";
    legalComments?: "none" | "inline" | "eof" | "linked" | "external";
    sourceRoot?: string;
    sourcesContent?: boolean;

    // 代码压缩相关
    minify?: boolean;
    minifyWhitespace?: boolean;
    minifyIdentifiers?: boolean;
    minifySyntax?: boolean;
    charset?: Charset;
    treeShaking?: TreeShaking;

    // jsx相关
    jsx?: "transform" | "preserve";
    jsxFactory?: string;
    jsxFragment?: string;
  }
  ```
  具体的描述可以看[这里](https://esbuild.github.io/api/#footer)
- `build`  
   `build`整合了`transform`后的代码，可以将一个或者多个文件转换并保存为文件。  
   使用：

  ```javascript
      // cli
      esbuild test.ts --outfile=./dist/test.js // { errors: [], warnings: [] }

      // js api调用
      const esbuild = require('esbuild');
      const path = require('path');

      const result = esbuild.buildSync({
        entryPoints: [path.resolve(__dirname, 'test.ts')],
        outdir: path.resolve(__dirname, 'dist'),
      });

      console.log(result); // { errors: [], warnings: [] }
  ```

  执行完后会生成转换后的代码文件到指定的目录，具体的配置参数可以点击[这里](https://esbuild.github.io/api/#build-api)

### esbuild 插件（Plugins）

与其他打包工具一样，esbuild 也有`plugin`，plugin 会在`build`的时候提供一些钩子函数，让你可以在打包的某一个阶段去执行自定义的操作。  
`plugin`提供了四个钩子，**按顺序执行**分别是:`onStart`，`onResolve`，`onLoad`，`onEnd`  
现在我们就来写一个测试的插件：

```javascript
const esbuild = require("esbuild");
const path = require("path");

// 测试插件
const testPlugin = {
  name: "testPlugin",
  setup({ onStart, onResolve, onLoad, onEnd }) {
    onStart(() => {
      console.log("onStart");
    });
    onResolve({ filter: /.*/ }, (msg) => {
      console.log("onResolve", msg);
    });
    onLoad({ filter: /.*/ }, (msg) => {
      console.log("onLoad", msg);
    });
    onEnd((msg) => {
      console.log("onEnd", msg);
    });
  },
};

esbuild.buildSync({
  entryPoints: [path.resolve(__dirname, "test.ts")],
  outdir: path.resolve(__dirname, "dist"),
  bundle: true,
  plugins: [testPlugin],
});
```

执行后返回

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b3666939a0b34c77a0281a5b25eb8354~tplv-k3u1fbpfcp-watermark.image)

## 实战：利用 esbuild 打包 ts 项目

讲完 esbuild 的大概用法，接下来做一个实战项目。项目中大概的步骤:

- 1.将 typescript 项目打包成 js 文件
- 2.将打包后的文件放到 HTML 中运行这个 HTML。

首先来写一个插入节点的 ts 文件`test.ts`

```typescript
// test.ts
(function () {
  const app = document.querySelector("#app");
  const div = document.createElement("div");
  div.innerHTML = "<div>Hello World</div>";
  app.appendChild(div);
})();
```

创建一个 html 文件

```html
<!DOCTYPE html>
<html>
  <head>
    <title>test html</title>
  </head>
  <body>
    <div id="app"></div>
    <script src="{{scripts}}"></script>
  </body>
</html>
```

接下来写打包逻辑

```javascript
// esbuild.js
const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");
// html文件地址
const HTML_PATH = path.resolve(__dirname, "index.html");
// 目标地址
const TARGET_PATH = path.resolve(__dirname, "dist");
// 输出js的地址
const OUTPUT_PATH = "./test.js";
/**
 * 自定义插件
 * @type { import('esbuild').Plugin }
 */
const testPlugin = {
  name: "testPlugin",
  setup({ onEnd }) {
    // 打包结束后执行替换和复制html操作
    onEnd(({ errors }) => {
      console.log(errors);
      if (!errors.length) {
        let data = fs.readFileSync(HTML_PATH, { encoding: "utf-8" });
        data = data.replace(`{scripts}`, OUTPUT_PATH);
        fs.writeFileSync(path.resolve(TARGET_PATH, "index.html"), data, {
          encoding: "utf-8",
        });
      }
    });
  },
};

// 打包主方法
esbuild
  .build({
    entryPoints: [path.resolve(__dirname, "test.ts")],
    outdir: path.resolve(__dirname, "dist"),
    bundle: true,
    plugins: [testPlugin],
  })
  .then((msg) => {
    if (msg.length) throw new Error("compile error");
    console.log("compile success");
  });
```

执行 esbuild.js 文件

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9b5b52140ce6455781caef14c909c36b~tplv-k3u1fbpfcp-watermark.image)

文件已经生成成功，打开 html 文件看一下有没有执行 js
![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f63e80bfe2064b7caed91c76627ecc84~tplv-k3u1fbpfcp-watermark.image)

代码成功执行
![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/feccfdf0e8cf4885b3f1c8405e37eef7~tplv-k3u1fbpfcp-watermark.image)

## 小结

本文主要介绍了`esbuild`打包工具。主要介绍了:

- esbuild 的性能比现在主流的打包工具要快得多
- esbuild 的 api 和用法
- esbuild 如何定义插件
- 利用 esbuild 打包一个 ts 项目

## 参考

1. [esbuild](https://esbuild.github.io/)
