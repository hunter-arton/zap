# path : zap-cli/setup.py

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="zap-cli",
    version="0.1.0",
    author="Hunter Arton",
    author_email="arton.hunter@gmail.com",
    description="CLI companion for Zap credential manager - inject secrets as environment variables",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/hunter-arton/zap",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Build Tools",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.8",
    install_requires=[
        "click>=8.3.0",
        "cryptography>=46.0.2",
        "rich>=14.1.0",
    ],
    entry_points={
        "console_scripts": [
            "zap=zap_cli.cli:cli",
        ],
    },
    keywords="credentials secrets environment variables development",
    project_urls={
        "Bug Reports": "https://github.com/hunter-arton/zap/issues",
        "Source": "https://github.com/hunter-arton/zap",
    },
)
