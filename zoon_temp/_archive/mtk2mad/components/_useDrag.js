/* dragLineBox(dd, el, jj, ii, snapPoints = []) {
      const dragPath = typeof el === 'string' ? document.querySelector(el) : el;
      
      if (!dragPath) {
        console.warn('[dragLineBox] 無法找到元素:', el);
        return;
      }
    
      const self = this;
      const SNAP_DISTANCE = 15;
      const scale = self.scalPick || 1;
      const width = this.WnH;
      
      const startP = (self.pathStyleSet.ss2 || []).map(Number);
      const endP = (self.pathStyleSet.ee2 || []).map(Number);
      const ss2 = this.setS2E(startP, self.pathStyleSet.lineTheme.st, width);
      const ee2 = this.setS2E(endP, self.pathStyleSet.lineTheme.ed, width);
    
      const points = self.treePointData[jj]?.lineTheme?.p || [];
    
      let isDragging = false;
      let animationFrameId = null;
      let startX = 0, startY = 0;
      let baseX = 0, baseY = 0;
    
      const checkSnap = (x, y) => {
        let snapX = x, snapY = y;
        let minDistX = SNAP_DISTANCE + 1;
        let minDistY = SNAP_DISTANCE + 1;
    
        const dynamicSnapCandidates = [
          points[ii - 1],
          points[ii + 1],
          ...(ii === 0 ? [ss2] : []),
          ...(ii === points.length - 1 ? [ee2] : []),
          ...snapPoints
        ].filter(Boolean);
    
        for (const point of dynamicSnapCandidates) {
          const distX = Math.abs(x - point[0]);
          const distY = Math.abs(y - point[1]);
          if (distX < minDistX) {
            minDistX = distX;
            snapX = point[0];
          }
          if (distY < minDistY) {
            minDistY = distY;
            snapY = point[1];
          }
        }
    
        if (minDistX <= SNAP_DISTANCE) x = snapX;
        if (minDistY <= SNAP_DISTANCE) y = snapY;
        return [x, y];
      };
    
      const updatePosition = (e) => {
        const dx = (e.clientX - startX) / scale;
        const dy = (e.clientY - startY) / scale;
        let newX = baseX + dx;
        let newY = baseY + dy;
        
        [newX, newY] = checkSnap(newX, newY);
        dd[0] = newX;
        dd[1] = newY;
    
        self.$set(points, ii, [newX, newY]);
        
      };
    
      const onMouseMove = (e) => {
        // if (!isDragging || animationFrameId) return;
        // console.log('～～～～～～～');
        animationFrameId = requestAnimationFrame(() => {
          updatePosition(e);
          animationFrameId = null;
        });
      };
    
      const onMouseUp = () => {
        isDragging = false;
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
    
      const onMouseDown = (e) => {
        if (!dragPath.isConnected) return;
        e.preventDefault();
        e.stopPropagation();
    
        startX = e.clientX;
        startY = e.clientY;
        baseX = dd[0];
        baseY = dd[1];
        isDragging = true;

        animationFrameId = requestAnimationFrame(() => updatePosition(e));
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      };
    
      // 確保每次只綁定一次事件，不再使用 `__dragHandler`
      if (!dragPath.__hasDragHandler) {
        dragPath.addEventListener('mousedown', onMouseDown);
        // dragPath.__hasDragHandler = true;
        dragPath.__dragHandler = onMouseDown;
      }
    }, */