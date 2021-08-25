## 常驻内存集

程序在运行时，都给程序会分配内存，让程序能保持运行，Javascript 程序在运行时 V8 也会给它分配内存，这种内存可以叫做`常驻内存集合`，V8 给这种常驻内存进一步细分成`栈`和`堆`，简单的分类可以看下图：  
![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a8b1c926f9c54b20a1fc75ba51a41007~tplv-k3u1fbpfcp-watermark.image)

来分析一下`栈`和`堆`分别是什么

### 栈(stack)

`栈`的特性是**后进先出**，用于存储 javascript 中的**基本类型**和**引用类型的指针**，**每个 V8 进程**都会有一个栈区域，它的存储顺序是**连续**的，所以在新增或删除数据是也只需要将指针移动到对应的位置，然后删除或修改数据，所以栈的**速度**非常快。

例如在 javascript 声明基本类型变量，他会在栈中这样表现

```javascript
var num = 1;
var str = 'str';
var bool = true;
var nul = null;
var undfi = undefined;
```

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/96dd885cc0124a02a765cf747ea6385e~tplv-k3u1fbpfcp-watermark.image)

### 堆(heap)

堆是 V8 内存分配一个重要的组成部分，主要用于存储 js 中的`引用类型`。看一下[V8 源码](https://github.com/v8/v8)中初始化 heap 的代码

```cc
// src/heap/heap.cc
void Heap::SetUpSpaces() {
  // 设置堆空间方法
  // Ensure SetUpFromReadOnlySpace has been ran.
  DCHECK_NOT_NULL(read_only_space_);
  const bool has_young_gen = !FLAG_single_generation && !IsShared();
  if (has_young_gen) {
    // 创建 new_space 空间
    space_[NEW_SPACE] = new_space_ =
        new NewSpace(this, memory_allocator_->data_page_allocator(),
                     initial_semispace_size_, max_semi_space_size_);
  }
  // 创建 old_space 空间
  space_[OLD_SPACE] = old_space_ = new OldSpace(this);
  // 创建 code_space 空间
  space_[CODE_SPACE] = code_space_ = new CodeSpace(this);
  // 创建 map_space 空间
  space_[MAP_SPACE] = map_space_ = new MapSpace(this);

  // 创建 long_object_space 空间
  space_[LO_SPACE] = lo_space_ = new OldLargeObjectSpace(this);
  if (has_young_gen) {
    // 创建 new_long_object_space 空间
    space_[NEW_LO_SPACE] = new_lo_space_ =
        new NewLargeObjectSpace(this, NewSpaceCapacity());
  }
  // 创建 code_long_object_space 空间
  space_[CODE_LO_SPACE] = code_lo_space_ = new CodeLargeObjectSpace(this);

  ...
  ...
}
```

从代码中可以看到，heap 分成了 7 个部分。相应地，在 node 的`v8`模块中可以查看 v8 给 javascript 程序分配堆内存的大小

```javascript
const v8 = require('v8');
const heapSpace = v8.getHeapSpaceStatistics();
console.log(heapSpace);
```

执行后返回

```javascript
[
  {
    space_name: 'read_only_space',
    space_size: 151552,
    space_used_size: 150392,
    space_available_size: 0,
    physical_space_size: 150680,
  },
  {
    space_name: 'new_space',
    space_size: 33554432,
    space_used_size: 11353680,
    space_available_size: 5405104,
    physical_space_size: 33515512,
  },
  {
    space_name: 'old_space',
    space_size: 61497344,
    space_used_size: 61167496,
    space_available_size: 47792,
    physical_space_size: 61324832,
  },
  {
    space_name: 'code_space',
    space_size: 1671168,
    space_used_size: 1431328,
    space_available_size: 27008,
    physical_space_size: 1500160,
  },
  {
    space_name: 'map_space',
    space_size: 1052672,
    space_used_size: 594504,
    space_available_size: 304680,
    physical_space_size: 896832,
  },
  {
    space_name: 'large_object_space',
    space_size: 22650880,
    space_used_size: 22627200,
    space_available_size: 0,
    physical_space_size: 22650880,
  },
  {
    space_name: 'code_large_object_space',
    space_size: 49152,
    space_used_size: 2880,
    space_available_size: 0,
    physical_space_size: 49152,
  },
  {
    space_name: 'new_large_object_space',
    space_size: 0,
    space_used_size: 0,
    space_available_size: 16758784,
    physical_space_size: 0,
  },
];
```

调用`v8.getHeapSpaceStatistics()`可以看到每个堆空间分配的大小和可用大小。  
接下来详细介绍一下这里面每一个堆空间代表着什么

#### 新生代(new space)

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/957e3ce49e5447f795ec2a87d6b6712f~tplv-k3u1fbpfcp-watermark.image)

新生代内存用于存放一些生命周期比较短的对象数据，例如：一些新创建的对象数据会存放到 new space 中。  
新生代内存有两个区域，分别是**对象区域(from)** 和 **空闲区域(to)**，两个区域都用一个`SemiSpace`对象来管理
新生代内存使用`Scavenger`算法来管理内存。

- SemiSpace

  `SemiSpace`对象主要负责管理地址，**不**负责垃圾回收和内存分配。  
   `SemiSpace`类的部分源码

```cc
// src/heap/new-spaces.h
class SemiSpace : public Space {
 public:
  using iterator = PageIterator;
  using const_iterator = ConstPageIterator;

  static void Swap(SemiSpace* from, SemiSpace* to);

  SemiSpace(Heap* heap, SemiSpaceId semispace)
      : Space(heap, NEW_SPACE, new NoFreeList()),
        current_capacity_(0),
        target_capacity_(0),
        maximum_capacity_(0),
        minimum_capacity_(0),
        age_mark_(kNullAddress),
        id_(semispace),
        current_page_(nullptr) {}

  inline bool Contains(HeapObject o) const;
  inline bool Contains(Object o) const;
  inline bool ContainsSlow(Address a) const;

  // 初始化分配地址
  void SetUp(size_t initial_capacity, size_t maximum_capacity);
  // 重置地址
  void TearDown();

  bool Commit();
  bool Uncommit();
  bool IsCommitted() { return !memory_chunk_list_.Empty(); }

  // 负责扩容
  bool GrowTo(size_t new_capacity);

  // 负责缩小容量
  void ShrinkTo(size_t new_capacity);

  ...
  ...
}
```

`SetUp`方法负责设置管理地址范围

```cc
void SemiSpace::SetUp(size_t initial_capacity, size_t maximum_capacity) {
  DCHECK_GE(maximum_capacity, static_cast<size_t>(Page::kPageSize));
  minimum_capacity_ = RoundDown(initial_capacity, Page::kPageSize);
  target_capacity_ = minimum_capacity_;
  maximum_capacity_ = RoundDown(maximum_capacity, Page::kPageSize);
}
```

`TearDown`负责重置管理的地址

```cc
void SemiSpace::TearDown() {
  // Properly uncommit memory to keep the allocator counters in sync.
  if (IsCommitted()) {
    Uncommit();
  }
  target_capacity_ = maximum_capacity_ = 0;
}
```

- `new space`内存分配规则  
   new space 的内存分配非常简单，规则如下：当需要分配内存时，new space 有一个分配指针指向需要分配的内存值，分配完成后指向下一个指针地址，直到空间被分配满，这时就会触发`Scavenger`算法进行垃圾回收。

- `Scavenger(Minor GC)`算法  
   `Scavenger`用于`new space`的垃圾收集，回收的规则如下：

  - 当前 new space 空间如下：
    ![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e38d4e0bdff04d2ba5edd16e4aa4be6c~tplv-k3u1fbpfcp-watermark.image)
    空间 1，2 仍在使用，3，4 则不再使用，这时有一个新的数据`5`需要存放
  - 当`from`空间被分配满后，有数据新的数据需要存放，触发垃圾回收机制，将仍在使用的数据复制到`to`中，不需要使用的则销毁，新数据存放到`to中`。如下图:

    ![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e0d6059cf568408a8f66acb81bd19504~tplv-k3u1fbpfcp-watermark.image)

    ![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a9fceb6331e8446e9595ce4e18d65469~tplv-k3u1fbpfcp-watermark.image)

  - 当`to`空间分配满后，空间 1，2 仍在使用，空间 5 和其他数据不再使用。若有数据进入会触发数据 GC 机制，空间 1，2 会进入**老生代**，而不再使用的数据则会被清除掉。如下图

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2905d99c21fd4e69a44fc72f5fdb8af7~tplv-k3u1fbpfcp-watermark.image)

`new space`就在这种“反复横跳”的过程中进行内存管理，这种内存管理快速而且高效，虽然 new space 分配到的内存不多，但它的速度很快。同时也会造成很大的空间浪费，因为`from`和`to`总是有一个是会置空的。

#### 老生代(old space)

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/cf002a44811d4745bb0260468a4571f5~tplv-k3u1fbpfcp-watermark.image)

`old space`其实相当于常驻内存，v8 会将长期停留在`new space`的数据放到`old space`中。  
Oldspace 类的代码如下：

```cc
// src/heap/paged-spaces.h
class OldSpace : public PagedSpace {
 public:
  // Creates an old space object. The constructor does not allocate pages
  // from OS.
  explicit OldSpace(Heap* heap)
      : PagedSpace(heap, OLD_SPACE, NOT_EXECUTABLE,
                   FreeList::CreateFreeList()) {}

  static bool IsAtPageStart(Address addr) {
    return static_cast<intptr_t>(addr & kPageAlignmentMask) ==
           MemoryChunkLayout::ObjectStartOffsetInDataPage();
  }

  size_t ExternalBackingStoreBytes(ExternalBackingStoreType type) const final {
    if (type == ExternalBackingStoreType::kArrayBuffer)
      return heap()->OldArrayBufferBytes();
    return external_backing_store_bytes_[type];
  }
};
```

可以看到它继承了`PagedSpace`类，`PagedSpace`类用于创建和管理 space，除了`OldSpace`，继承`PagedSpace`类的还有**CodeSpace**和**MapSpace**。

- 常驻内存分配
  上文提到：`v8会将长期停留在new space的数据放到old space中`。那么它具体的规则是：当`new space`的 Scavenger 进行**两个周期**的垃圾回收后，如果数据还存在`new space`中，则将他们存放到`old space`中。

`old space`又可以分为两部分，分别是`Old pointer space`和`Old data space`

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/2c43fa8a0507421a8489f669ca2c879e~tplv-k3u1fbpfcp-watermark.image)

- **Old pointer space**
  主要存放指向其他对象的指针。

- **Old data space**
  主要存放数据对象

Old Space 使用`Major GC(Mark-Sweep & Mark-Compact)` 进行内存管理

- **Major GC(Mark-Sweep & Mark-Compact)**
  `Major GC`主要用于`Old Space`内存管理，它的触发条件是：当没有足够的`Old Space`进行分配时，他就会触发垃圾回收。  
   `Major GC`使用的是**Mark-Sweep-Compact（标记-清除-整理）** 算法进行垃圾回收，所以 Major GC 进行垃圾回收主要有三步。
  - 标记  
     首先，垃圾回收算法会判断哪些数据仍在使用，哪些数据不再使用。垃圾回收中会有一个`root`节点记录那些节点仍在使用，用`按深度优先`的方法遍历节点树，如果数据不在树中，则会被标记为不再使用。
    ![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b6b8b064a940469cbb28c949949994dd~tplv-k3u1fbpfcp-watermark.image)
  - 清除  
     回收算法把不再使用的对象标记出来后，将这些空间重新标记为空，使他们能够重新存放其他对象
  - 整理  
     当`清除`的动作执行完后，这时内存空间可能会出现比较碎片化的问题，这**不利于新进入的对象分配**，这时需要整理一下内存空间，提高给对象分配内存的速度。
    ![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5d379478b4494a4789d8ce3729f95671~tplv-k3u1fbpfcp-watermark.image)

使用这种垃圾回收方法进行回收时，会将所有正在运行的程序停止，等待垃圾回收完成后再恢复，所以它会**阻塞**jsvascript 程序运行。  
为了避免这种回收的时间过长影响 js 执行，v8 引擎在这方面做了这些：

- 将标记-清除-整理分成了**多个步骤**进行
- `标记`会放在辅助线程中进行，从而不阻塞 Javascript 主线程，当 Javascript 创建对象同时，辅助线程也会将它标记起来。
- `清除`和`整理`会在辅助线程中完成，从而不阻塞 Javascript 主线程
- 懒清除：垃圾回收的执行会在**需要使用内存**时才会执行

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c41c2acd63dc437682ba3c3d44316a9c~tplv-k3u1fbpfcp-watermark.image)

#### 其他空间介绍

- **Code space** 用于存放 JIT 已编译的代码
- **Large object space** 一个大于其他空间的对象，每个对象都有一个独立的内存。垃圾回收不会动这里的对象
- **Map space** 只存放 map 对象，而且他们不会移动。

## 分配内存

简单地了解完 V8 中的**栈**和**堆**。下面看一下 javascript 中声明变量后在 v8 时如何分配的

### 基本类型

基本类型会直接存放到栈中，例如上文例子：

```javascript
var num = 1;
var str = 'str';
var bool = true;
var nul = null;
var undfi = undefined;
```

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/96dd885cc0124a02a765cf747ea6385e~tplv-k3u1fbpfcp-watermark.image)

### 引用类型

引用类型包括 `function`，`array`，`object`。他们在声明后，栈的值时 heap 的指针值。来看一个例子

```javascript
function Test(num, people, bool) {
  this.num = num;
  this.people = people;
  this.bool = bool;
}

var data = new Test(1, 'people', true);

console.log(data);
```

内存分配的图如下：

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4642b7bdc6954c1182522967a50940d5~tplv-k3u1fbpfcp-watermark.image)

实例化数据后内存分配如下  
![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5144bd3cbb81414aaa85e195ac693f93~tplv-k3u1fbpfcp-watermark.image)

执行完实例化语句后  
![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f0bd42f0c35e415292d875b0eaf8ebf0~tplv-k3u1fbpfcp-watermark.image)

## 小结

本文主要介绍了 V8 的内存分配和数据回收，主要内容：

- 常驻内存集，了解栈和堆分别时什么
- 堆(heap)分配的空间和垃圾回收算法
- Javascript 声明变量后栈和堆是如何分配内存的

## 参考

1. [Visualizing memory management in V8 Engine](https://deepu.tech/memory-management-in-v8/)

2. [V8](https://github.com/v8/v8)

3. [js 引擎 v8 源码分析之 SemiSpace](https://cloud.tencent.com/developer/article/1584487)
