'use scrict';
let leftArr = [],
    rightArr = []
document.addEventListener('DOMContentLoaded', function() {
  const panel = document.querySelector('.panel'),
        panelClose = panel.querySelector('.panel__close');
  panelClose.addEventListener('click', () => {
    panel.remove();
  });


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
    leftArr = getDataArrays(data)[0];
    console.log(leftArr);
    rightArr = getDataArrays(data)[1];
    handleFriendsReplacement();
    makeDnD(leftArr, rightArr);
    filterLists(leftArr, rightArr);
    saveFriends(leftArr, rightArr);
  });


  // Функции

  function updateDataArrays(id, target, firstClass, secondClass) {
    if(target.classList.contains(firstClass)) {
      const selectedElem = leftArr.filter((item) => item.id == id);
      console.log(selectedElem);
      console.log(leftArr.indexOf(...selectedElem));
      leftArr.splice(leftArr.indexOf(...selectedElem), 1);
      rightArr.push(...selectedElem);
    } else if (target.classList.contains(secondClass)) {
      const selectedElem = rightArr.filter((item) => item.id == id);
      rightArr.splice(rightArr.indexOf(...selectedElem), 1);
      leftArr.push(...selectedElem);
    }
  }

  function updateDataOnClick (target) {
      const id = target.parentNode.dataset.id;
      console.log('HTML-id: ' + id);
      updateDataArrays(id, target, 'friends__add-btn', 'friends__remove-btn')
  }

  function changeFriendsHTML (targ) {
    const initialList = document.querySelector('.friends-initial');
    const selectedList = document.querySelector('.friends-selected');
    if(targ.classList.contains('friends__add-btn')) {
      selectedList.appendChild(targ.parentNode);
    } else if(targ.classList.contains('friends__remove-btn')) {
      initialList.appendChild(targ.parentNode);
    }
  }


  function handleFriendsReplacement() {
    const listWrapper = document.querySelector('.panel__friends-wrapper');
    listWrapper.addEventListener('click', e => {
      const target = e.target;
      changeFriendsHTML(target);
      updateDataOnClick(target);
    })
  }

  function getDataArrays (data) {
    const leftListArr = data;
    const rightListArr = [];
    return [leftListArr, rightListArr]
  }


  function createListItem (arr, list) {
    // console.log(arr);
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
    const leftList = document.querySelector('.friends-initial');
    const rightList = document.querySelector('.friends-selected');
    const storage = localStorage;
    if(!storage.friends) {
      createListItem(leftListArr, leftList);
      createListItem(rightListArr, rightList);
    }
  }

  function getFullNames(arr) {
    return arr.map((item) => {
      return item.first_name + ' ' + item.last_name;
    })
  }

  function createFilteredArr(names, value) {
    return names.filter(item => isMatching(item, value.toLowerCase() ))
  }

  function saveFriends() {
    const saveBtn = document.querySelector('.save-btn');
    saveBtn.addEventListener('click', () => {
      console.log({
        leftArr: leftArr,
        rightArr: rightArr
      })
    })
  }

  function isMatching (firstName, lastName, chunk)  {
    return firstName.toLowerCase().indexOf(chunk.toLowerCase()) > -1
    ||
    lastName.toLowerCase().indexOf(chunk.toLowerCase()) > -1;
  };



  function updateHtmlOnKeyup(list, arr, value) {
    list.innerHTML = '';
    const filteredArr = arr.filter(item => isMatching(item.first_name, item.last_name, value))
    console.log(filteredArr);
  }

  function filterLists() {
    const inputs = document.querySelectorAll('.panel__filters-input');
    const lists = document.querySelectorAll('ul.friends');
    lists.forEach((list, i) => {
      inputs[i].addEventListener('keyup', function () {
        const ths = this;
        i === 0 ? updateHtmlOnKeyup(list, leftArr, ths.value) : updateHtmlOnKeyup(list, rightArr, ths.value);
      })
    })

  }


  function updateDataOnDnd (target) {
    const id = target.dataset.id;
    console.log(id);
    updateDataArrays(id, target.parentNode, 'friends-selected', 'friends-initial')
  }


  function makeDnD(leftArr, rightArr) {
    const zones = document.querySelectorAll('.friends');

    let currentDrag;

    zones.forEach(zone => {
        zone.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/html', 'dragstart');
            currentDrag = { source: zone, node: e.target };
        });

        // zone.addEventListener('dragenter', e => {
        //   e.preventDefault()
        //   if(currentDrag.source !== zone) {
        //     if(e.target.classList.contains('friends__item')) {
        //       deleteShape();
        //       console.log('bla')
        //       const shape = document.createElement('li');
        //       shape.classList.add('shape');
        //       if(zone.children.length && !e.target.previousElementSibling.classList.contains('shape')) {
        //         zone.insertBefore(shape, e.target);

        //       }else if(zone.children.length && e.target.previousElementSibling.classList.contains('shape')) {
        //         console.log('previous');
        //       } else {
        //         zone.appendChild(shape);
        //         console.log('Нет детей' + zone.children.length)
        //       }
        //     } else {}
        //   }
        // })

        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
        });


        zone.addEventListener('drop', (e) => {
            if (currentDrag) {
                e.preventDefault();
                console.log(currentDrag.node.parentNode)
                if (currentDrag.source !== zone) {
                    if(e.target.parentNode.classList.contains('friends__item')) {
                      zone.insertBefore(currentDrag.node, e.target.parentNode);
                    } else if(e.target.classList.contains('friends__item')) {
                      zone.insertBefore(currentDrag.node, e.target);
                    } else {
                      zone.appendChild(currentDrag.node);
                    }
                    updateDataOnDnd(currentDrag.node)
                }

                currentDrag = null;
            }
        });
    })
}


});
