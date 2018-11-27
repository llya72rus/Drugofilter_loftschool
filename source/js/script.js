'use scrict';
document.addEventListener('DOMContentLoaded', function() {
  const panel = document.querySelector('.panel'),
        panelClose = panel.querySelector('.panel__close');
  panelClose.addEventListener('click', () => {
    panel.remove();
  })

  const listAreas = document.querySelectorAll('.panel__friends-container');

  VK.init({
    apiId: 6762284
  });

  const callAPI = (method, params) => {
    params.v = '5.76';

    return new Promise((resolve, reject) => {
      VK.api(method, params, (data) => {
        if(data.error) {
          reject(data.error);
        } else {
          resolve(data.response)
        }
      })
    });

  };

  const auth = () => {
    return new Promise((resolve, reject) => {
      VK.Auth.login(data => {
        if(data.session) {
          resolve();
        } else {
          reject(new Error('Не удалось авторизоваться'));
        }
      }, 2)
    })
  }

auth()
  .then(() => {
    return callAPI('friends.get', { fields: 'photo_50'})
  })
  .then((friends) => {
    const resultArr = getDataArrays(friends.items);
    fillListsOnPageLoad(...resultArr);
    return friends.items;

  }).then((data) => {
    console.log(data);
    let [leftArr] = getDataArrays(data);
    let [, rightArr] = getDataArrays(data);
    handleFriendsReplacement(data, leftArr, rightArr);
    saveFriends(leftArr, rightArr);
    makeDnD(listAreas);
    const fullNamesArr = getFullNames(data);
  });

  function updateDataOnClick (target, data, leftArr, rightArr) {
      if(target.classList.contains('friends__add-btn')) {
        const id = target.parentNode.dataset.id;
        const newElem = data.filter((item) => item.id == id);
        rightArr.push(...newElem);
        leftArr.splice(leftArr.indexOf(newElem), 1);
      } else if(target.classList.contains('friends__remove-btn')) {
        const id = target.parentNode.dataset.id;
        const newElem = data.filter((item) => item.id == id);
        rightArr.splice(rightArr.indexOf(newElem), 1);
        leftArr.push(newElem);
      }
  }

  function changeFriendsHTML (targ) {
    const initialList = document.querySelector('#friends-initial');
    const selectedList = document.querySelector('#friends-selected');
    if(targ.classList.contains('friends__add-btn')) {
      selectedList.appendChild(targ.parentNode);
    } else if(targ.classList.contains('friends__remove-btn')) {
      initialList.appendChild(targ.parentNode);
    }
  }


  function handleFriendsReplacement(data, leftArr, rightArr) {
    const listWrapper = document.querySelector('.panel__friends-wrapper');
    listWrapper.addEventListener('click', e => {
      const target = e.target;
      changeFriendsHTML(target);
      updateDataOnClick(target, data, leftArr, rightArr);
    })
  }

  function getDataArrays (data) {
    const leftListArr = data;
    const rightListArr = [];
    return [leftListArr, rightListArr]
  }


  function createListItem (arr, list) {
    const fragment = document.createDocumentFragment();
    arr.forEach((item) => {
      const li = document.createElement('li');
      li.classList.add('friends__item');
      li.dataset.id = item.id;
      const img = document.createElement('img');
      img.classList.add('friends__img');
      img.src = item.photo_50;
      img.draggable = false;
      const h4 = document.createElement('h4');
      h4.classList.add('friends__name');
      h4.textContent = `${item.first_name} ${item.last_name}`;
      const addBtn = document.createElement('button');
      addBtn.classList.add('friends__add-btn');
      const removeBtn = document.createElement('button');
      removeBtn.classList.add('friends__remove-btn');
      li.appendChild(img);
      li.appendChild(h4);
      li.appendChild(addBtn);
      li.appendChild(removeBtn);
      li.draggable = true;
      fragment.appendChild(li);
    })
    list.appendChild(fragment);
}

  function fillListsOnPageLoad (leftListArr, rightListArr) {
    const leftList = document.querySelector('#friends-initial');
    const rightList = document.querySelector('#friends-selected');
    const storage = localStorage;
    if(!storage.friends) {
      createListItem(leftListArr, leftList);
      createListItem(rightListArr, rightList);
    }
  }

  function getFullNames(data) {
    return data.map((item) => {
      return item.first_name + ' ' + item.last_name;
    })
  }

  function createFilteredArr(names, value) {
    return names.filter((item) => isMatching(item, value.toLowerCase() ))
  }

  function saveFriends(leftArr, rightArr) {
    const saveBtn = document.querySelector('.save-btn');
    saveBtn.addEventListener('click', () => {
      console.log({
        leftArr: leftArr,
        rightArr: rightArr
      })
    })
  }

  function isMatching (full, chunk)  {
    return full.toLowerCase().indexOf(chunk.toLowerCase()) > -1;
  };

  function filterInitialList (names, data) {
    const input = document.querySelector('#initial-list-input');
    const list = document.querySelector('#friends-initial');
    // const initialArrNames = data.map(item => item.first_name + ' ' + item.last_name);
    // console.log("Индекс: " +   names.indexOf("Влад Кравец"));
    input.addEventListener('keyup', function() {
      list.innerHTML = '';
      const selectedItemNodes = document.querySelectorAll('#friends-selected .friends__name');
      const selectedArr = Array.from(selectedItemNodes).map(item => item.textContent);
      const filteredArr = createFilteredArr(names, input.value);
      console.log('Массив в левом списке: ' + filteredArr);
      console.log('Массив в правом списке: ' +selectedArr);
      const fragment = document.createDocumentFragment();
      filteredArr.forEach((item) => {
        // console.log(item);
        if(!selectedArr.includes(item)) {
          console.log('Not includes');
          const li = document.createElement('li');
          li.classList.add('friends__item');

          // const
        } else {
          console.log('includes!!');
        }

      })
    });
  };


  function makeDnD(zones) {
    let currentDrag;

    zones.forEach(zone => {
        zone.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/html', 'dragstart');
            currentDrag = { source: zone, node: e.target };
        });

        zone.addEventListener('dragenter', e => {
          e.preventDefault()
          if(currentDrag.source !== zone && e.target.classList.contains('friends__item')) {
            if (document.querySelector('.mark')) {
              document.querySelector('.mark').remove()
              // console.log('remove');
            }
              const mark = document.createElement('li');
              mark.classList.add('mark');
              zone.querySelector('.friends').insertBefore(mark, e.target)
            }
        })

        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
        });


        zone.addEventListener('drop', (e) => {
          // const mark = document.querySelector('.mark');
          // if(mark) mark.remove();
            if (currentDrag) {
                e.preventDefault();

                if (currentDrag.source !== zone) {
                  console.log(zone.querySelector('.friends .mark'));
                    console.log(e.target.classList);
                    if (e.target.classList.contains('mark')) {
                      zone.querySelector('.friends .mark').replaceWith(currentDrag.node);
                    } else if(e.target.parentNode.classList.contains('friends__item')) {
                      zone.querySelector('.friends').insertBefore(currentDrag.node, e.target.parentNode);
                    } else {
                      zone.querySelector('.friends').appendChild(currentDrag.node);
                    }
                }

                currentDrag = null;
            }
        });
    })
}


})
