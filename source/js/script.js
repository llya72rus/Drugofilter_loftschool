'use scrict';

document.addEventListener('DOMContentLoaded', function () {

    const panel = document.querySelector('.panel'),
        panelClose = panel.querySelector('.panel__close'),
        leftList = document.querySelector('.friends-initial'),
        rightList = document.querySelector('.friends-selected'),
        leftInput = document.querySelector('#initial-list-input'),
        rightInput = document.querySelector('#selected-list-input');

    // Переменные со списками друзей, которые будут впоследствии обновляться
    let leftArr = [],
        rightArr = [];

    // Закрывает панель списков
    panelClose.addEventListener('click', () => {
      const a = panel.querySelector('.panel__friends-wrapper')
      const img = document.createElement("img");
      img.src = 'img/img_1.jpg';
      img.classList.add('note-img');
      a.innerHTML = '';
      a.appendChild(img);
    });

    const storage = localStorage;

    if (storage.friends) {
        const leftStoredArr = JSON.parse(storage.friends).allFriends;
        const rightStoredArr = JSON.parse(storage.friends).selectedFriends;
        leftArr = leftStoredArr;
        rightArr = rightStoredArr;
        fillListsOnPageLoaded();
        handleFriendsReplacementOnClick();
        makeDnD();
        filterLists();
        saveFriends();
        clearStorage();
    } else {
        getFriendsFromVK();
    }

    function getFriendsFromVK() {
        VK.init({
            apiId: 6762284
        });

        const callAPI = (method, params) => {
            params.v = '5.76';

            return new Promise((resolve, reject) => {
                VK.api(method, params, (data) => {
                    if (data.error) {
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
                    if (data.session) {
                        resolve();
                    } else {
                        reject(new Error('Не удалось авторизоваться'));
                    }
                }, 2)
            })
        }

        auth()
            .then(() => {
                return callAPI('friends.get', {
                    fields: 'photo_50'
                })
            })
            .then((friends) => {
                leftArr = friends.items;
                fillListsOnPageLoaded();
                return friends.items;

            }).then((data) => {
                handleFriendsReplacementOnClick();
                makeDnD();
                filterLists();
                saveFriends();
                clearStorage();
            });

    }
    // Функции-обработчики:


    // Обновляет данные в списках
    function updateDataArrays(id, target, firstClass, secondClass) {
        if (target.classList.contains(firstClass)) {
            const selectedElem = leftArr.filter((item) => item.id == id);
            leftArr.splice(leftArr.indexOf(...selectedElem), 1);
            rightArr.push(...selectedElem);
            return selectedElem;
        } else if (target.classList.contains(secondClass)) {
            const selectedElem = rightArr.filter((item) => item.id == id);
            rightArr.splice(rightArr.indexOf(...selectedElem), 1);
            leftArr.push(...selectedElem);
            return selectedElem;
        }
    }

    // В двух последующих функциях не смог добавлять id параметров, поэтому пришлось доп.функции updateOn... создать
    function updateDataOnClick(target) {
        const id = target.parentNode.dataset.id;
        const [friend] = updateDataArrays(id, target, 'friends__add-btn', 'friends__remove-btn');
        return friend;
    }

    function updateDataOnDnd(target) {
        const id = target.dataset.id;
        const [friend] = updateDataArrays(id, target.parentNode, 'friends-selected', 'friends-initial');
        return friend;
    }

    function filterFriendBasedOnInputValue(elem, input) {
      const a = isMatching(elem.first_name, elem.last_name, input.value);
      return a;
    }



    function changeFriendsHTMLonClick(targ, friend) {
        if (targ.classList.contains('friends__add-btn')) {
          if(filterFriendBasedOnInputValue(friend, rightInput)) {
            rightList.appendChild(targ.parentNode);
          } else {
            targ.parentNode.remove();
          }
        } else if (targ.classList.contains('friends__remove-btn') ) {
          if(filterFriendBasedOnInputValue(friend, leftInput) ) {
            leftList.appendChild(targ.parentNode);
          } else {
            targ.parentNode.remove();
          }
        }
    }

    function handleFriendsReplacementOnClick() {
        const listWrapper = document.querySelector('.panel__friends-wrapper');
        let friend = {};
        listWrapper.addEventListener('click', e => {
          const target = e.target;
          if(target.tagName === 'BUTTON') {
            friend = updateDataOnClick(target);
            changeFriendsHTMLonClick(target, friend);
          }
        })
        return friend;
    }


    function createListItem(arr, list) {
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

    function fillListsOnPageLoaded() {
        createListItem(leftArr, leftList);
        createListItem(rightArr, rightList);
    }


    function isMatching(firstName, lastName, chunk) {
        return firstName.toLowerCase().indexOf(chunk.toLowerCase()) > -1 ||
            lastName.toLowerCase().indexOf(chunk.toLowerCase()) > -1;
    };



    function updateHtmlOnKeyup(list, arr, value) {
        list.innerHTML = '';
        const filteredArr = arr.filter(item => isMatching(item.first_name, item.last_name, value))
        createListItem(filteredArr, list);
        return filteredArr;
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


    function makeDnD() {
        const zones = document.querySelectorAll('.friends');

        let currentDrag;

        zones.forEach(zone => {
            zone.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/html', 'dragstart');
                currentDrag = {
                    source: zone,
                    node: e.target
                };
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
                    if (currentDrag.source !== zone) {
                        if (e.target.parentNode.classList.contains('friends__item')) {
                            zone.insertBefore(currentDrag.node, e.target.parentNode);
                        } else if (e.target.classList.contains('friends__item')) {
                            zone.insertBefore(currentDrag.node, e.target);
                        } else {
                            zone.appendChild(currentDrag.node);
                        }
                    }
                    const friend  = updateDataOnDnd(currentDrag.node);

                    if(zone.classList.contains('friends-selected')) {
                      if(!filterFriendBasedOnInputValue(friend, rightInput)) {
                        currentDrag.node.remove();
                      }
                    } else if(zone.classList.contains('friends-initial')) {
                      if(!filterFriendBasedOnInputValue(friend, leftInput)) {
                        currentDrag.node.remove();
                      }
                    }


                    currentDrag = null;
                }
            });
        });
    }

    function sortByKey(array, key) {
        return array.sort(function (a, b) {
            const x = a[key];
            const y = b[key];

            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });
    }

    function saveFriends() {
        const saveBtn = document.querySelector('.save-btn');

        saveBtn.addEventListener('click', () => {
            const sortedRightArr = sortByKey(rightArr, 'first_name');
            storage.friends = JSON.stringify({
                allFriends: leftArr,
                selectedFriends: sortedRightArr
            });
            alert('Сохранено!');
        })
    }

    function clearStorage() {
        const clearBtn = document.querySelector('.clear-btn');
        clearBtn.addEventListener('click', () => {
            if (storage.friends) {
                storage.friends = "";
            }
            location.reload();
        })
    }


});
