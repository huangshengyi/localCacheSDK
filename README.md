## 解决多终端的静态文件缓存工具库
> 这是个人封装的一个缓存库，通用的并不一定适合每个项目，请根据自己的需求来修改，

> 注意： 文件路径建议给绝对路径。


<p>使用方法：</p>

<pre>
<code>
1. 引入该工具库
2. 调用该缓存库提供的接口实现


例子：
    // 缓存版本的控制
    var newVersion = 1508756298995;

    // 调用缓存初始化方法
    // 参数一: 控制是否要打开缓存
    // 参数二: 缓存的版本号
    localCache.init('on', newVersion);

    // 是否需要手动清除所有缓存,一般不要理会，
    // 工具库里已经实现了当缓存溢出自动清理了
    localCache.clearCache = '8989'
    
    // 指定需要缓存的文件资源列表
    localCache.resourceList = [
        {
            url: '/xiaomi00/js/index.js', // 文件所在位置
            type: 'script' // 文件的类型
        },
        {
            url: '/xiaomi00/js/cchh.js',
            type: 'script'
        },
        {
            url: '/xiaomi00/css/base.css',
            type: 'style'
        },
        {
            url: '/xiaomi00/css/index.css',
            type: 'style'
        },
        {
            url: '/xiaomi00/css/aabb.css',
            type: 'style'
        }
    ];


    localCache.startUpLocalCache(); // 最后要调用该方法来启动本地缓存
</code>
</pre>