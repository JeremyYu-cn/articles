(function(window) {
    var defaultOption = {
        width: 600,
        height: 300,
    }
    /**
     * 创建canvas实例
     */
    function createCanvasContext(canvasId) {
        var canvas = document.querySelector(canvasId);
        if (!canvas) return null;
        var ctx = canvas.getContext('2d');
        return { canvas, ctx };
    }

    function main(options = defaultOption) {
        const pixel = window.screen.pixelDepth;
        var element = createCanvasContext('#canvas');
        var canvas = element.canvas;
        var ctx = element.ctx;
        canvas.style.width = (options.width) * pixel;
        canvas.style.height = (options.height) * pixel;
        var data = getBezierCurveAxial(10, 20, 50, 50);
        var { cpAx, cpAy, cpBx, cpBy, x, y } = data;
        ctx.bezierCurveTo(cpAx, cpAy, cpBx, cpBy, x, y);

        ctx.stroke();
    }

    /**
     * 计算贝塞尔曲线的控制点
     * @param {*} preX 前一个点的X轴
     * @param {*} preY 前一个点的Y轴
     * @param {*} currentX 当前点的X轴
     * @param {*} currentY 当前点的Y轴
     */
    function getBezierCurveAxial(preX, preY, currentX, currentY) {
        var cpX = (preX + currentX) / 2;
        return { cpAx: cpX, cpAy: preY, cpBx: cpX, cpBy: currentY, x: currentX, y: currentY };
    }

    main();
})(window)
