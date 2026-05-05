# <<cv.name>>'s CV

((* if cv.phone *))
- Phone: <<cv.phone|replace("tel:", "")|replace("-"," ")>>
((* endif *))
((* if cv.email *))
- Email: [<<cv.email>>](mailto:<<cv.email>>)
((* endif *))
((* if cv.location *))
- Location: <<cv.location>>
((* endif *))
((* if cv.website *))
- Website: [<<cv.website|replace("https://","")|replace("/","")>>](<<cv.website>>)
((* endif *))
((* if cv.social_networks *))
    ((* for network in cv.social_networks *))
- <<network.network>>: [<<network.username>>](<<network.url>>)
    ((* endfor *))
((* endif *))

# <<section_title>>
## **University of Turin**
*Turin, Italy*


*Sept 2022 – Mar 2025*

*BS* *in* *Computer Science*

- Thesis work on deep reinforcement learning for an autonomous driving simulation in Godot

- Granted access to resources from the high performance computing center HPC4AI for the scope of the Thesis



# <<section_title>>
## **Software Engineer**

*Turin, Italy*

*June 2021 – Dec 2023*

*Sistemi*

- Developed and shipped multiple SPA and web applications focusing on making the most of the proprietary project management software



## **IT Consultant**

*Turin, Italy*

*Feb 2024 – Jan 2025*

*Sistemi*

- Created and maintained a system for data collection and analysis of data using Apache Kafka



# <<section_title>>
## **[Blog](https://blog.teflonofjoy.com/)**

*Nov 2022 – present*

Collaborative blog with my good friend 0universe0, hosted on Netlify and seamlessly deployed through my custom domain

- Built with HUGO and shipped with Netlify



# <<section_title>>
**Programming:** Proficient with Python, C, Java, Dafny, Kotlin and Git, ; good understanding of Web, app development, and DevOps

**Mathematics:** Good understanding of differential equations, calculus, linear algebra, mathematical logic, formal systems and software verification through formal methods

**Languages:** English (fluent, Cambridge English: C2 Proficiency), French (native), Italyn (native)
