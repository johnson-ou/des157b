(function() {
    'use strict';

    const featuredProjects = [
        {
            image: 'images/goldengate.jpg',
            imageLight: 'images/seattle1.jpg',
        },
        {
            image: 'images/carnight.jpeg',
            imageLight: 'images/seattle2.jpg',
        },
        {
            image: 'images/bluehour.jpg',
            imageLight: 'images/seattle3.jpg',
        }
    ];

    const contentColumns = [
        {
            groups: [
                {
                    title: 'Ministudios',
                    items: ['Blockbuster Video', 'Check Yourself', 'Library Liberty']
                },
                {
                    title: 'Toolkit',
                    items: ['Friends List']
                }
            ]
        },
        {
            groups: [
                {
                    title: 'Research',
                    items: [
                        'Brainstorm',
                        'Competitive Analysis',
                        'Annotated Bibliography',
                        'Feasibility Report',
                        'Usability Results'
                    ]
                }
            ]
        },
        {
            groups: [
                {
                    title: 'Development',
                    items: [
                        'Proposal',
                        'Sketches',
                        'User Flows',
                        'Design Progress',
                        'LoFi Sketches',
                        'Version 1',
                        'Usability Test',
                        'Version 2'
                    ]
                }
            ]
        },
        {
            groups: [
                {
                    title: 'Capstone',
                    items: ['Case Study', 'Project']
                }
            ]
        }
    ];

    const button = document.querySelector('button');
    const body = document.querySelector('body');
    const banner = document.querySelector('#banner');
    const contentGrid = document.querySelector('#contentGrid');
    const projectStrip = document.querySelector('#projectStrip');
    let sections = document.querySelectorAll('section');
    let mode = 'dark';

    function renderProjects() {
        projectStrip.innerHTML = '';

        for (const project of featuredProjects) {
            const card = document.createElement('div');

            card.className = 'project-card';

            if (project.image) {
                const imgDark = document.createElement('img');
                imgDark.src = project.image;
                imgDark.alt = project.title;
                imgDark.className = 'img-dark';
                card.appendChild(imgDark);

                if (project.imageLight) {
                    const imgLight = document.createElement('img');
                    imgLight.src = project.imageLight;
                    imgLight.alt = project.title;
                    imgLight.className = 'img-light';
                    card.appendChild(imgLight);
                }
            }

            projectStrip.appendChild(card);
        }
    }

    function renderSections() {
        contentGrid.innerHTML = '';

        for (const columnData of contentColumns) {
            const column = document.createElement('div');
            column.className = 'content-column';

            for (const groupData of columnData.groups) {
                const group = document.createElement('section');
                const heading = document.createElement('h2');
                const links = document.createElement('div');

                group.className = 'content-group';
                heading.className = 'section-title';
                links.className = 'section-links';

                heading.textContent = groupData.title;

                for (const item of groupData.items) {
                    const link = document.createElement('a');
                    link.href = '#';
                    link.textContent = item;
                    links.appendChild(link);
                }

                group.appendChild(heading);
                group.appendChild(links);
                column.appendChild(group);
            }

            contentGrid.appendChild(column);
        }

        sections = document.querySelectorAll('section');
    }

    renderProjects();
    renderSections();

    button.addEventListener('click', function() {
        if (mode === 'dark') {
            body.className = 'switch';
            banner.className = 'page-shell switch';
            button.className = 'toggle-pill switch';

            for (const section of sections) {
                section.className = `${section.className} switch`.trim();
            }

            mode = 'light';
        } else {
            body.removeAttribute('class');
            banner.className = 'page-shell';
            button.className = 'toggle-pill';

            for (const section of sections) {
                section.className = section.className.replace(' switch', '');
            }

            mode = 'dark';
        }
    });
})();